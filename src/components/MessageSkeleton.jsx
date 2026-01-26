import { motion } from 'framer-motion';
import Avatar from "@components/Avatar";

const MessageSkeleton = () => {
  return (
    <div className="flex items-start gap-2 mb-4">
      {/* Avatar */}
      <div className="flex justify-center md:block">
        <Avatar avatarType="bot" size="small" />
      </div>

      {/* Skeleton bubble */}
      <div className="rounded-b-xl rounded-tr-xl bg-brand-primary-200 border border-brand-primary-900 p-4 max-w-[85%] md:max-w-[70%]">
        {/* Animated lines */}
        <div className="space-y-3">
          <motion.div
            className="h-3 bg-brand-primary-400/40 rounded-full w-64"
            animate={{ opacity: [0.3, 0.6, 0.3] }}
            transition={{ duration: 1.5, repeat: Infinity }}
          />
          <motion.div
            className="h-3 bg-brand-primary-400/40 rounded-full w-48"
            animate={{ opacity: [0.3, 0.6, 0.3] }}
            transition={{ duration: 1.5, repeat: Infinity, delay: 0.2 }}
          />
          <motion.div
            className="h-3 bg-brand-primary-400/40 rounded-full w-56"
            animate={{ opacity: [0.3, 0.6, 0.3] }}
            transition={{ duration: 1.5, repeat: Infinity, delay: 0.4 }}
          />
        </div>

        {/* Loading indicator */}
        <div className="flex items-center gap-3 mt-4 pt-3 border-t border-brand-primary-400/30">
          {/* Animated dots */}
          <div className="flex gap-1">
            <motion.div
              className="w-2 h-2 rounded-full bg-brand-primary-900"
              animate={{ scale: [1, 1.3, 1], opacity: [0.5, 1, 0.5] }}
              transition={{ duration: 0.8, repeat: Infinity }}
            />
            <motion.div
              className="w-2 h-2 rounded-full bg-brand-primary-900"
              animate={{ scale: [1, 1.3, 1], opacity: [0.5, 1, 0.5] }}
              transition={{ duration: 0.8, repeat: Infinity, delay: 0.15 }}
            />
            <motion.div
              className="w-2 h-2 rounded-full bg-brand-primary-900"
              animate={{ scale: [1, 1.3, 1], opacity: [0.5, 1, 0.5] }}
              transition={{ duration: 0.8, repeat: Infinity, delay: 0.3 }}
            />
          </div>

          {/* Rotating messages */}
          <motion.span
            className="text-sm text-brand-primary-900/70 font-medium"
            animate={{ opacity: [0.5, 1, 0.5] }}
            transition={{ duration: 2, repeat: Infinity }}
          >
            Analizando tu consulta...
          </motion.span>
        </div>
      </div>
    </div>
  );
};

export default MessageSkeleton;
