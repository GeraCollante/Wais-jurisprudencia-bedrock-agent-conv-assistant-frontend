import { useEffect, useRef, useState, useCallback } from 'react';
import { MessageQueue } from '../utils/MessageQueue';

/**
 * Connection States - State Machine
 */
const ConnectionState = {
  IDLE: 'idle',
  CONNECTING: 'connecting',
  CONNECTED: 'connected',
  RECONNECTING: 'reconnecting',
  DISCONNECTED: 'disconnected',
  FAILED: 'failed',
};

/**
 * Calculate exponential backoff with jitter
 * Prevents thundering herd when multiple clients reconnect simultaneously
 */
const calculateBackoff = (attempt, baseDelay = 1000, maxDelay = 30000) => {
  const exponential = Math.min(baseDelay * Math.pow(2, attempt), maxDelay);
  const jitter = Math.random() * 0.3 * exponential; // ±30% jitter
  return Math.floor(exponential + jitter);
};

/**
 * Robust WebSocket Hook with auto-reconnection, message queue, and health monitoring
 *
 * @param {string} url - WebSocket URL
 * @param {object} options - Configuration options
 * @returns {object} - WebSocket interface
 */
export const useRobustWebSocket = (url, options = {}) => {
  const {
    heartbeatInterval = 30000,      // 30 seconds
    reconnectMaxRetries = 5,
    reconnectBaseDelay = 1000,      // 1 second
    messageTimeout = 60000,         // 60 seconds
    onMessage = () => {},
    onStatusChange = () => {},
    onError = () => {},
    enabled = true,                 // Allow disabling WebSocket
  } = options;

  // State
  const [status, setStatus] = useState(ConnectionState.IDLE);
  const [lastError, setLastError] = useState(null);
  const [metrics, setMetrics] = useState({
    latency: 0,
    messagesQueued: 0,
    messagesSent: 0,
    messagesReceived: 0,
    reconnectCount: 0,
    lastConnectedAt: null,
  });

  // Refs
  const ws = useRef(null);
  const messageQueue = useRef(new MessageQueue());
  const reconnectAttempt = useRef(0);
  const reconnectTimeout = useRef(null);
  const heartbeatInterval_ref = useRef(null);
  const heartbeatTimeout_ref = useRef(null);
  const pendingRequests = useRef(new Map());
  const isManuallyClosed = useRef(false);

  /**
   * Update status with logging and callback
   */
  const updateStatus = useCallback((newStatus) => {
    console.log(`[useRobustWebSocket] Status: ${status} → ${newStatus}`);
    setStatus(newStatus);
    onStatusChange(newStatus);
  }, [status, onStatusChange]);

  /**
   * Update metrics
   */
  const updateMetrics = useCallback((updates) => {
    setMetrics(prev => ({ ...prev, ...updates }));
  }, []);

  /**
   * Start heartbeat (ping-pong)
   */
  const startHeartbeat = useCallback(() => {
    console.log('[useRobustWebSocket] Starting heartbeat');

    heartbeatInterval_ref.current = setInterval(() => {
      if (ws.current?.readyState === WebSocket.OPEN) {
        const ping = {
          type: 'ping',
          timestamp: Date.now(),
        };

        console.log('[useRobustWebSocket] Sending ping');
        ws.current.send(JSON.stringify(ping));

        // Expect pong within 5 seconds
        heartbeatTimeout_ref.current = setTimeout(() => {
          console.warn('[useRobustWebSocket] Pong timeout - zombie connection detected');
          ws.current?.close();
          reconnect();
        }, 5000);
      }
    }, heartbeatInterval);
  }, [heartbeatInterval]);

  /**
   * Stop heartbeat
   */
  const stopHeartbeat = useCallback(() => {
    console.log('[useRobustWebSocket] Stopping heartbeat');
    clearInterval(heartbeatInterval_ref.current);
    clearTimeout(heartbeatTimeout_ref.current);
  }, []);

  /**
   * Handle pong response
   */
  const handlePong = useCallback((data) => {
    clearTimeout(heartbeatTimeout_ref.current);
    const latency = Date.now() - data.timestamp;
    console.log('[useRobustWebSocket] Pong received, latency:', latency, 'ms');
    updateMetrics({ latency });
  }, [updateMetrics]);

  /**
   * Process queued messages
   */
  const processQueue = useCallback(() => {
    console.log('[useRobustWebSocket] Processing message queue, size:', messageQueue.current.size());

    while (!messageQueue.current.isEmpty() && ws.current?.readyState === WebSocket.OPEN) {
      const item = messageQueue.current.dequeue();
      if (item) {
        console.log('[useRobustWebSocket] Sending queued message:', item.id);
        ws.current.send(JSON.stringify(item.message));
        updateMetrics({ messagesSent: metrics.messagesSent + 1 });
      }
    }

    updateMetrics({ messagesQueued: messageQueue.current.size() });
  }, [metrics.messagesSent, updateMetrics]);

  /**
   * Connect WebSocket
   */
  const connect = useCallback(() => {
    if (!url || !enabled) {
      console.log('[useRobustWebSocket] Connection skipped (disabled or no URL)');
      return;
    }

    if (ws.current?.readyState === WebSocket.OPEN || ws.current?.readyState === WebSocket.CONNECTING) {
      console.log('[useRobustWebSocket] Already connected or connecting');
      return;
    }

    console.log('[useRobustWebSocket] Connecting to:', url);
    updateStatus(reconnectAttempt.current > 0 ? ConnectionState.RECONNECTING : ConnectionState.CONNECTING);

    try {
      ws.current = new WebSocket(url);

      ws.current.onopen = () => {
        console.log('[useRobustWebSocket] ✅ Connected');
        updateStatus(ConnectionState.CONNECTED);
        updateMetrics({
          lastConnectedAt: Date.now(),
          reconnectCount: reconnectAttempt.current,
        });

        // Reset reconnect attempt
        reconnectAttempt.current = 0;

        // Start heartbeat
        startHeartbeat();

        // Process queued messages
        processQueue();
      };

      ws.current.onmessage = (event) => {
        try {
          const data = JSON.parse(event.data);

          // Handle pong
          if (data.type === 'pong') {
            handlePong(data);
            return;
          }

          // Handle regular messages
          console.log('[useRobustWebSocket] Message received:', data.type || 'unknown');
          updateMetrics({ messagesReceived: metrics.messagesReceived + 1 });
          onMessage(data, event);
        } catch (error) {
          console.error('[useRobustWebSocket] Failed to parse message:', error);
        }
      };

      ws.current.onerror = (error) => {
        console.error('[useRobustWebSocket] ❌ WebSocket error:', error);
        setLastError({ message: 'WebSocket error', timestamp: Date.now() });
        onError(error);
      };

      ws.current.onclose = (event) => {
        console.log('[useRobustWebSocket] WebSocket closed:', event.code, event.reason);
        stopHeartbeat();

        // Don't reconnect if manually closed
        if (isManuallyClosed.current) {
          console.log('[useRobustWebSocket] Manual close, not reconnecting');
          updateStatus(ConnectionState.DISCONNECTED);
          isManuallyClosed.current = false;
          return;
        }

        // Abnormal closure - reconnect
        if (event.code !== 1000) {
          console.warn('[useRobustWebSocket] Abnormal closure, will reconnect');
          updateStatus(ConnectionState.DISCONNECTED);
          reconnect();
        } else {
          updateStatus(ConnectionState.DISCONNECTED);
        }
      };
    } catch (error) {
      console.error('[useRobustWebSocket] Failed to create WebSocket:', error);
      setLastError({ message: error.message, timestamp: Date.now() });
      updateStatus(ConnectionState.FAILED);
      reconnect();
    }
  }, [url, enabled, updateStatus, updateMetrics, startHeartbeat, processQueue, handlePong, onMessage, onError, stopHeartbeat, metrics.messagesReceived]);

  /**
   * Reconnect with exponential backoff
   */
  const reconnect = useCallback(() => {
    if (reconnectAttempt.current >= reconnectMaxRetries) {
      console.error('[useRobustWebSocket] Max reconnect attempts reached');
      updateStatus(ConnectionState.FAILED);
      setLastError({
        message: `Failed to reconnect after ${reconnectMaxRetries} attempts`,
        timestamp: Date.now()
      });
      return;
    }

    const delay = calculateBackoff(reconnectAttempt.current, reconnectBaseDelay);
    console.log(`[useRobustWebSocket] Reconnecting in ${delay}ms (attempt ${reconnectAttempt.current + 1}/${reconnectMaxRetries})`);
    reconnectAttempt.current++;

    reconnectTimeout.current = setTimeout(() => {
      connect();
    }, delay);
  }, [reconnectMaxRetries, reconnectBaseDelay, updateStatus, connect]);

  /**
   * Send message (with queue fallback)
   */
  const send = useCallback((message) => {
    if (ws.current?.readyState === WebSocket.OPEN) {
      console.log('[useRobustWebSocket] Sending message immediately');
      ws.current.send(JSON.stringify(message));
      updateMetrics({ messagesSent: metrics.messagesSent + 1 });
      return true;
    } else {
      console.warn('[useRobustWebSocket] WebSocket not open, queueing message');
      messageQueue.current.enqueue(message);
      updateMetrics({ messagesQueued: messageQueue.current.size() });

      // Try to reconnect if not already
      if (status === ConnectionState.DISCONNECTED || status === ConnectionState.FAILED) {
        reconnect();
      }

      return false;
    }
  }, [status, metrics.messagesSent, updateMetrics, reconnect]);

  /**
   * Disconnect cleanly
   */
  const disconnect = useCallback(() => {
    console.log('[useRobustWebSocket] Disconnecting cleanly');
    isManuallyClosed.current = true;
    clearTimeout(reconnectTimeout.current);
    stopHeartbeat();
    ws.current?.close(1000, 'Manual disconnect');
    updateStatus(ConnectionState.DISCONNECTED);
  }, [updateStatus, stopHeartbeat]);

  /**
   * Force reconnect
   */
  const forceReconnect = useCallback(() => {
    console.log('[useRobustWebSocket] Force reconnect triggered');
    reconnectAttempt.current = 0; // Reset attempts
    disconnect();
    setTimeout(() => connect(), 100);
  }, [disconnect, connect]);

  /**
   * Initial connection
   */
  useEffect(() => {
    if (enabled && url) {
      connect();
    }

    return () => {
      console.log('[useRobustWebSocket] Cleanup');
      clearTimeout(reconnectTimeout.current);
      stopHeartbeat();
      ws.current?.close(1000, 'Component unmounted');
    };
  }, [enabled, url]); // Only connect when url or enabled changes

  return {
    send,
    disconnect,
    reconnect: forceReconnect,
    status,
    lastError,
    metrics,
    isConnected: status === ConnectionState.CONNECTED,
    isConnecting: status === ConnectionState.CONNECTING || status === ConnectionState.RECONNECTING,
  };
};

export default useRobustWebSocket;
