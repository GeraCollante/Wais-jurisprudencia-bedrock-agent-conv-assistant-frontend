/**
 * useFunctionURLStream Hook
 *
 * Custom React hook for consuming Lambda Function URL streaming responses.
 * Replaces WebSocket architecture with HTTP streaming (NDJSON format).
 *
 * Features:
 * - Server-Sent Events style streaming over HTTP
 * - Automatic reconnection on errors
 * - NDJSON parsing (Newline Delimited JSON)
 * - JWT token authentication via centralized auth service
 * - Automatic token refresh on 401/403
 * - Real-time chunk processing
 */

import { useState, useCallback, useRef } from 'react';
import { getValidAccessToken, onSessionEvent } from '../services/authService';

const FUNCTION_URL = import.meta.env.VITE_CHAT_STREAM_FUNCTION_URL;

// Error types for specific handling
const ERROR_TYPES = {
  SESSION_EXPIRED: 'SESSION_EXPIRED',
  NETWORK_ERROR: 'NETWORK_ERROR',
  SERVER_ERROR: 'SERVER_ERROR',
  ABORTED: 'ABORTED',
};

export const useFunctionURLStream = ({ onMessage, onError, onSessionExpired }) => {
  const [isStreaming, setIsStreaming] = useState(false);
  const [isConnected, setIsConnected] = useState(true);
  const [lastError, setLastError] = useState(null);
  const abortControllerRef = useRef(null);
  const retryCountRef = useRef(0);
  const maxRetries = 1;

  /**
   * Handle authentication errors
   */
  const handleAuthError = useCallback((error) => {
    console.error('[useFunctionURLStream] Auth error:', error);
    setIsConnected(false);
    setLastError({ type: ERROR_TYPES.SESSION_EXPIRED, message: 'Sesion expirada' });
    onSessionExpired?.({ reason: error.message });
    onError?.('Tu sesion ha expirado. Por favor, inicia sesion nuevamente.');
  }, [onError, onSessionExpired]);

  /**
   * Send a query to the Lambda Function URL and process streaming response
   */
  const sendQuery = useCallback(async ({ query, session_id }) => {
    if (!FUNCTION_URL) {
      console.error('VITE_CHAT_STREAM_FUNCTION_URL not configured');
      onError?.('Function URL not configured');
      return false;
    }

    const attemptRequest = async (isRetry = false) => {
      try {
        setIsStreaming(true);
        setLastError(null);

        // Get valid token using centralized auth service
        // This handles token refresh automatically
        const token = await getValidAccessToken();

        // Create abort controller for cancellation
        abortControllerRef.current = new AbortController();

        // Prepare request
        const requestBody = {
          query,
          session_id
        };

        console.log('Sending query to Function URL:', { query, session_id, isRetry });

        // Fetch with streaming
        const response = await fetch(FUNCTION_URL, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`
          },
          body: JSON.stringify(requestBody),
          signal: abortControllerRef.current.signal
        });

        // Handle auth errors with retry
        if (response.status === 401 || response.status === 403) {
          console.warn(`[useFunctionURLStream] Received ${response.status}`);

          if (!isRetry && retryCountRef.current < maxRetries) {
            retryCountRef.current++;
            console.log('[useFunctionURLStream] Retrying with refreshed token...');
            // Token will be refreshed on next getValidAccessToken call
            return await attemptRequest(true);
          }

          // Max retries exceeded
          const error = new Error('SESSION_EXPIRED');
          error.status = response.status;
          throw error;
        }

        // Handle other errors
        if (!response.ok) {
          const errorText = await response.text();
          let errorMessage;
          try {
            const errorJson = JSON.parse(errorText);
            errorMessage = errorJson.error || `HTTP ${response.status}`;
          } catch {
            errorMessage = `HTTP ${response.status}: ${response.statusText}`;
          }

          if (response.status >= 500) {
            setLastError({ type: ERROR_TYPES.SERVER_ERROR, message: errorMessage });
          }

          throw new Error(errorMessage);
        }

        // Reset retry count on success
        retryCountRef.current = 0;

        // Connection confirmed good
        setIsConnected(true);

        // Get reader for streaming response
        const reader = response.body.getReader();
        const decoder = new TextDecoder();

        let buffer = '';
        let streamData = {
          sources: null,
          chunks: [],
          metadata: null
        };

        // Read stream
        while (true) {
          const { done, value } = await reader.read();

          if (done) {
            console.log('Stream completed');
            break;
          }

          // Decode chunk
          buffer += decoder.decode(value, { stream: true });

          // Process complete lines (NDJSON format)
          const lines = buffer.split('\n');
          buffer = lines.pop(); // Keep incomplete line in buffer

          for (const line of lines) {
            if (!line.trim()) continue;

            try {
              const data = JSON.parse(line);
              console.log('Stream message:', data);

              // Handle different message types
              switch (data.type) {
                case 'sources':
                  // Received sources before streaming starts
                  streamData.sources = data.sources;
                  streamData.queries = data.queries;
                  onMessage?.(data); // Notify sources received
                  break;

                case 'stream_start':
                  // Stream is starting
                  console.log('Stream started');
                  onMessage?.(data);
                  break;

                case 'chunk':
                  // Text chunk from LLM
                  streamData.chunks.push(data.content);
                  onMessage?.(data); // Stream each chunk to UI
                  break;

                case 'stream_end':
                  // Stream completed
                  console.log('Stream ended, total chunks:', streamData.chunks.length);
                  onMessage?.(data);
                  break;

                case 'complete':
                  // Final metadata
                  streamData.metadata = data;
                  onMessage?.(data);
                  break;

                case 'error':
                  // Error occurred
                  console.error('Stream error:', data.error);
                  onError?.(data.error);
                  break;

                case 'status':
                  // Status message (e.g., "processing")
                  onMessage?.(data);
                  break;

                default:
                  // Handle backward compatibility or unknown types
                  onMessage?.(data);
              }
            } catch (parseError) {
              console.error('Failed to parse NDJSON line:', line, parseError);
            }
          }
        }

        setIsStreaming(false);
        return true;

      } catch (error) {
        console.error('Stream error:', error);

        if (error.name === 'AbortError') {
          console.log('Stream aborted by user');
          setLastError({ type: ERROR_TYPES.ABORTED, message: 'Streaming cancelado' });
        } else if (error.message === 'SESSION_EXPIRED') {
          handleAuthError(error);
        } else if (error.message?.includes('fetch') || error.message?.includes('network')) {
          setLastError({ type: ERROR_TYPES.NETWORK_ERROR, message: 'Error de red' });
          onError?.('Error de conexion. Verifica tu conexion a internet.');
        } else {
          onError?.(error.message);
        }

        setIsStreaming(false);
        return false;
      }
    };

    return attemptRequest();
  }, [onMessage, onError, handleAuthError]);

  /**
   * Cancel current stream
   */
  const cancelStream = useCallback(() => {
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
      console.log('Stream cancelled');
    }
  }, []);

  /**
   * Test connection by validating token
   */
  const testConnection = useCallback(async () => {
    try {
      const token = await getValidAccessToken();
      const isValid = !!token;
      setIsConnected(isValid);
      return isValid;
    } catch {
      setIsConnected(false);
      return false;
    }
  }, []);

  return {
    sendQuery,
    cancelStream,
    isStreaming,
    isConnected,
    lastError,
    status: isStreaming ? 'streaming' : (isConnected ? 'ready' : 'disconnected'),
    testConnection
  };
};

export default useFunctionURLStream;
