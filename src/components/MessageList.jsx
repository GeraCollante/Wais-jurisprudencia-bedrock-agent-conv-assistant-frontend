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
    listContainer.current.scrollTop = listContainer.current.scrollHeight;
  };

  return (
    <div
      ref={listContainer}
      className="flex-1 space-y-6 overflow-y-auto rounded-xl bg-slate-200  p-4 text-sm leading-6 text-slate-900 shadow-sm dark:bg-slate-900 dark:text-slate-300 sm:text-base sm:leading-7"
    >
      <AnimatePresence initial={false}>
        {messages.map((message) => (
          <motion.div
            onAnimationStart={scrollContainer}
            key={message.id}
            positionTransition
            initial={{ opacity: 0, y: 100 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, transition: { duration: 0.15 } }}
          >
            <MessageBubble
              key={message.id}
              message={message}
              setMessageRating={setMessageRating}
            />
          </motion.div>
        ))}
      </AnimatePresence>
    </div>
  );
}
