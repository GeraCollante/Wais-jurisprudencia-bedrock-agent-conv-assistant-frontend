/**
 * useFunctionURLBuffered Hook
 *
 * Custom React hook for consuming Lambda Function URL buffered (non-streaming) responses.
 * Adapted from useFunctionURLStream to work with BUFFERED invoke mode.
 *
 * Features:
 * - Single buffered HTTP response (not streaming)
 * - JWT token authentication via centralized auth service
 * - Automatic token refresh on 401/403
 * - Compatible with 15-minute Lambda timeout
 * - Same interface as useFunctionURLStream for easy migration
 */

import { useState, useCallback, useRef } from 'react';
import { authenticatedFetch, onSessionEvent } from '../services/authService';

const FUNCTION_URL = import.meta.env.VITE_CHAT_STREAM_FUNCTION_URL;

// Error types for specific handling
const ERROR_TYPES = {
  SESSION_EXPIRED: 'SESSION_EXPIRED',
  NETWORK_ERROR: 'NETWORK_ERROR',
  SERVER_ERROR: 'SERVER_ERROR',
  ABORTED: 'ABORTED',
};

export const useFunctionURLBuffered = ({ onMessage, onError, onSessionExpired }) => {
  const [isStreaming, setIsStreaming] = useState(false);
  const [isConnected, setIsConnected] = useState(true);
  const [lastError, setLastError] = useState(null);
  const abortControllerRef = useRef(null);

  /**
   * Handle authentication errors
   */
  const handleAuthError = useCallback((error) => {
    console.error('[useFunctionURLBuffered] Auth error:', error);
    setIsConnected(false);
    setLastError({ type: ERROR_TYPES.SESSION_EXPIRED, message: 'Sesion expirada' });
    onSessionExpired?.({ reason: error.message });
    onError?.('Tu sesion ha expirado. Por favor, inicia sesion nuevamente.');
  }, [onError, onSessionExpired]);

  /**
   * Send a query to the Lambda Function URL and process buffered response
   */
  const sendQuery = useCallback(async ({ query, session_id, model = 'sonnet' }) => {
    if (!FUNCTION_URL) {
      console.error('VITE_CHAT_STREAM_FUNCTION_URL not configured');
      onError?.('Function URL not configured');
      return false;
    }

    try {
      setIsStreaming(true);
      setLastError(null);

      // Create abort controller for cancellation
      abortControllerRef.current = new AbortController();

      // Prepare request
      const requestBody = {
        query,
        session_id,
        model
      };

      console.log('Sending query to Function URL (buffered mode):', { query, session_id, model });

      // Use centralized auth service for the request
      // This handles token refresh and 401/403 automatically
      const response = await authenticatedFetch(FUNCTION_URL, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(requestBody),
        signal: abortControllerRef.current.signal
      }, {
        maxRetries: 1,
        useIdToken: false, // Use access token for Lambda Function URL
      });

      // Handle non-OK responses that aren't auth errors (already handled by authenticatedFetch)
      if (!response.ok) {
        const errorText = await response.text();
        let errorMessage;
        try {
          const errorJson = JSON.parse(errorText);
          errorMessage = errorJson.error || `HTTP ${response.status}`;
        } catch {
          errorMessage = `HTTP ${response.status}: ${response.statusText}`;
        }

        // Check if it's a server error vs client error
        if (response.status >= 500) {
          setLastError({ type: ERROR_TYPES.SERVER_ERROR, message: errorMessage });
        }

        throw new Error(errorMessage);
      }

      // Get complete buffered response as JSON
      const data = await response.json();
      console.log('Buffered response received:', data);

      // Connection is confirmed good
      setIsConnected(true);

      // Send sources first (if available)
      if (data.sources && data.sources.length > 0) {
        onMessage?.({
          type: 'sources',
          sources: data.sources,
          queries: data.queries || []
        });
      }

      // Signal start of streaming (required to initialize currentStreamingMessage)
      onMessage?.({
        type: 'stream_start'
      });

      // Send the complete answer as a single chunk
      // To maintain compatibility with streaming interface, we send it as chunks
      if (data.answer) {
        onMessage?.({
          type: 'chunk',
          content: data.answer
        });
      }

      // Send completion metadata (use 'stream_end' to match Chat.jsx expectations)
      onMessage?.({
        type: 'stream_end',
        total_sources: data.total_sources || 0,
        execution_time: data.execution_time || 0,
        session_id: data.session_id
      });

      setIsStreaming(false);
      return true;

    } catch (error) {
      console.error('Buffered fetch error:', error);

      if (error.name === 'AbortError') {
        console.log('Request aborted by user');
        setLastError({ type: ERROR_TYPES.ABORTED, message: 'Solicitud cancelada' });
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
  }, [onMessage, onError, handleAuthError]);

  /**
   * Cancel current request
   */
  const cancelStream = useCallback(() => {
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
      console.log('Request cancelled');
    }
  }, []);

  /**
   * Test connection by validating token
   */
  const testConnection = useCallback(async () => {
    try {
      const { getValidAccessToken } = await import('../services/authService');
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

export default useFunctionURLBuffered;
