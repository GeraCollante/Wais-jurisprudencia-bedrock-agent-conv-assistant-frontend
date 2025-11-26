import { motion } from 'framer-motion';
import PropTypes from 'prop-types';

/**
 * Enhanced Connection Status Indicator Component
 * Shows visual feedback about WebSocket connection state with metrics
 */
const ConnectionStatus = ({ status = 'disconnected', latency = 0, onReconnect = null, messagesQueued = 0 }) => {
  const statusConfig = {
    idle: {
      color: 'bg-gray-500',
      text: 'Inactivo',
      pulseColor: 'bg-gray-400',
      icon: '⚪',
      showPulse: false,
      showReconnect: false,
    },
    connecting: {
      color: 'bg-yellow-500',
      text: 'Conectando...',
      pulseColor: 'bg-yellow-400',
      icon: '🟡',
      showPulse: true,
      showReconnect: false,
    },
    connected: {
      color: 'bg-green-500',
      text: 'Conectado',
      pulseColor: 'bg-green-400',
      icon: '🟢',
      showPulse: true,
      showReconnect: false,
    },
    reconnecting: {
      color: 'bg-orange-500',
      text: 'Reconectando...',
      pulseColor: 'bg-orange-400',
      icon: '🟠',
      showPulse: true,
      showReconnect: true,
    },
    disconnected: {
      color: 'bg-red-500',
      text: 'Desconectado',
      pulseColor: 'bg-red-400',
      icon: '🔴',
      showPulse: false,
      showReconnect: true,
    },
    failed: {
      color: 'bg-red-700',
      text: 'Error de conexión',
      pulseColor: 'bg-red-600',
      icon: '🔴',
      showPulse: false,
      showReconnect: true,
    },
  };

  const config = statusConfig[status] || statusConfig.idle;

  return (
    <div className="flex items-center gap-3 px-4 py-2 rounded-full bg-gray-100 dark:bg-gray-800">
      {/* Status indicator with pulse */}
      <div className="relative flex items-center">
        <div className={`w-3 h-3 rounded-full ${config.color}`} />

        {/* Pulse animation */}
        {config.showPulse && (
          <motion.div
            className={`absolute inset-0 rounded-full ${config.pulseColor}`}
            animate={{
              scale: [1, 1.8, 1],
              opacity: [0.7, 0, 0.7]
            }}
            transition={{
              duration: 2,
              repeat: Infinity,
              ease: 'easeInOut'
            }}
          />
        )}
      </div>

      {/* Status text */}
      <span className="text-sm font-medium text-gray-700 dark:text-gray-200">
        {config.text}
      </span>

      {/* Latency (only when connected) */}
      {status === 'connected' && latency > 0 && (
        <span className="text-xs text-gray-500 dark:text-gray-400 bg-gray-200 dark:bg-gray-700 px-2 py-1 rounded">
          {latency}ms
        </span>
      )}

      {/* Queued messages indicator */}
      {messagesQueued > 0 && (
        <span
          className="text-xs font-semibold text-orange-700 dark:text-orange-300 bg-orange-100 dark:bg-orange-900/30 px-2 py-1 rounded"
          title={`${messagesQueued} ${messagesQueued === 1 ? 'mensaje' : 'mensajes'} en cola`}
        >
          📤 {messagesQueued}
        </span>
      )}

      {/* Reconnect button */}
      {config.showReconnect && onReconnect && (
        <button
          onClick={onReconnect}
          className="text-xs font-medium px-3 py-1 rounded-md border border-current hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors"
          title="Forzar reconexión"
        >
          🔄 Reintentar
        </button>
      )}
    </div>
  );
};

ConnectionStatus.propTypes = {
  status: PropTypes.oneOf(['idle', 'connecting', 'connected', 'reconnecting', 'disconnected', 'failed']),
  latency: PropTypes.number,
  onReconnect: PropTypes.func,
  messagesQueued: PropTypes.number,
};

export default ConnectionStatus;
