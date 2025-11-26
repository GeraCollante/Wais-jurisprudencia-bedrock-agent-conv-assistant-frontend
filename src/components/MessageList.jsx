import { useRef } from "react";
import MessageBubble from "@components/MessageBubble";
import { motion, AnimatePresence } from "framer-motion";
import PropTypes from "prop-types";

MessageList.propTypes = {
  messages: PropTypes.array.isRequired,
  setMessageRating: PropTypes.func.isRequired,
};

export default function MessageList({ messages, setMessageRating }) {
  const listContainer = useRef(null);
  const scrollContainer = () => {
    // Asegurarse de que listContainer.current existe antes de acceder a scrollTop/scrollHeight
    if (listContainer.current) {
      listContainer.current.scrollTop = listContainer.current.scrollHeight;
    }
  };

  return (
    <div
      ref={listContainer}
      className="
        flex-1 space-y-6 overflow-y-auto rounded-xl
        bg-brand-bg-surface p-4 text-sm leading-5 text-brand-text-primary shadow-sm /* Fondo surface, Texto primary */
        /* Se eliminaron: dark:bg-logo-grey/20 dark:text-logo-white */
        sm:text-base sm:leading-6
      "
    >
      <AnimatePresence initial={false}>
        {messages.map((message) => (
          <motion.div
            key={message.id}
            // No usar layout - causa sliding cuando el contenido cambia durante streaming
            onAnimationComplete={scrollContainer}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.2 }}
            exit={{ opacity: 0, transition: { duration: 0.1 } }}
          >
            <MessageBubble
              message={message}
              setMessageRating={setMessageRating}
            />
          </motion.div>
        ))}
      </AnimatePresence>
    </div>
  );
}