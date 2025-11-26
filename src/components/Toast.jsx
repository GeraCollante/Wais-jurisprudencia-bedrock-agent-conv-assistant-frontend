import { motion, AnimatePresence } from 'framer-motion';
import PropTypes from 'prop-types';

const Toast = ({ message, type = 'info', onClose }) => {
  const typeStyles = {
    error: 'bg-red-500',
    success: 'bg-green-500',
    info: 'bg-blue-500',
    warning: 'bg-yellow-500'
  };

  const typeIcons = {
    error: '❌',
    success: '✓',
    info: 'ℹ️',
    warning: '⚠️'
  };

  return (
    <AnimatePresence>
      {message && (
        <motion.div
          initial={{ opacity: 0, y: 50, scale: 0.95 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: 50, scale: 0.95 }}
          transition={{ duration: 0.2 }}
          className={`fixed bottom-6 right-6 ${typeStyles[type]} text-white px-6 py-4 rounded-lg shadow-2xl max-w-md z-50`}
        >
          <div className="flex items-start gap-3">
            <span className="text-xl">{typeIcons[type]}</span>
            <p className="flex-1 text-sm leading-relaxed">{message}</p>
            <button
              onClick={onClose}
              className="text-white hover:text-gray-200 transition-colors text-lg font-bold"
              aria-label="Cerrar notificación"
            >
              ×
            </button>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

Toast.propTypes = {
  message: PropTypes.string,
  type: PropTypes.oneOf(['error', 'success', 'info', 'warning']),
  onClose: PropTypes.func.isRequired
};

export default Toast;
