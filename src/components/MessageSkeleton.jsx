import { motion } from 'framer-motion';

const MessageSkeleton = () => {
  return (
    <div className="flex gap-4 mb-6">
      {/* Avatar skeleton */}
      <div className="flex-shrink-0">
        <div className="w-10 h-10 rounded-full bg-gray-200 animate-pulse" />
      </div>

      {/* Message content skeleton */}
      <div className="flex-1 space-y-3">
        {/* Header */}
        <div className="flex items-center gap-2">
          <div className="h-4 bg-gray-200 rounded w-24 animate-pulse" />
          <div className="h-3 bg-gray-100 rounded w-16 animate-pulse" />
        </div>

        {/* Message lines */}
        <div className="space-y-2">
          <motion.div
            className="h-4 bg-gray-200 rounded w-full"
            animate={{ opacity: [0.5, 1, 0.5] }}
            transition={{ duration: 1.5, repeat: Infinity }}
          />
          <motion.div
            className="h-4 bg-gray-200 rounded w-5/6"
            animate={{ opacity: [0.5, 1, 0.5] }}
            transition={{ duration: 1.5, repeat: Infinity, delay: 0.2 }}
          />
          <motion.div
            className="h-4 bg-gray-200 rounded w-4/6"
            animate={{ opacity: [0.5, 1, 0.5] }}
            transition={{ duration: 1.5, repeat: Infinity, delay: 0.4 }}
          />
        </div>

        {/* Typing indicator */}
        <div className="flex items-center gap-2 mt-4">
          <div className="flex gap-1">
            <motion.div
              className="w-2 h-2 rounded-full bg-gray-400"
              animate={{ y: [0, -8, 0] }}
              transition={{ duration: 0.6, repeat: Infinity }}
            />
            <motion.div
              className="w-2 h-2 rounded-full bg-gray-400"
              animate={{ y: [0, -8, 0] }}
              transition={{ duration: 0.6, repeat: Infinity, delay: 0.1 }}
            />
            <motion.div
              className="w-2 h-2 rounded-full bg-gray-400"
              animate={{ y: [0, -8, 0] }}
              transition={{ duration: 0.6, repeat: Infinity, delay: 0.2 }}
            />
          </div>
          <span className="text-sm text-gray-500">Buscando jurisprudencia...</span>
        </div>
      </div>
    </div>
  );
};

export default MessageSkeleton;
