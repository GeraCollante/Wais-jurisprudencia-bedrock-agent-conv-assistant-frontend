import PropTypes from "prop-types";
import { useState } from "react";
import { CopyToClipboard } from "react-copy-to-clipboard";
import {
  IconCopy,
  IconThumbDown,
  IconThumbUp,
  IconCheck,
} from "@tabler/icons-react";

MessageActions.propTypes = {
  message: PropTypes.object.isRequired,
  setMessageRating: PropTypes.func.isRequired,
};

export default function MessageActions({ message, setMessageRating }) {
  const [isCopied, setIsCopied] = useState(false);

  const handleCopy = () => {
    setIsCopied(true);
    setTimeout(() => setIsCopied(false), 800);
  };

  const handleButtonClick = (event) => {
    const value = event.currentTarget.value;

    // Make sure not to update to same rating
    if (message.rating !== value) {
      setMessageRating(message, value);
    }
  };

  const ratingActions = [
    {
      value: 0,
      classNames: "text-red-600 hover:text-red-500",
      icon: <IconThumbDown className="w-5" />,
    },
    {
      value: 1,
      classNames: "text-green-600 hover:text-green-500",
      icon: <IconThumbUp className="w-5" />,
    },
  ];

  return (
    <div className="ml-2 mt-1 flex gap-2 text-slate-500 sm:flex-row">
      <CopyToClipboard text={message.content} onCopy={handleCopy}>
        <button className="hover:text-blue-600">
          <span>
            {isCopied ? (
              <IconCheck className="w-5 text-green-500" />
            ) : (
              <IconCopy className="w-5" />
            )}
          </span>
        </button>
      </CopyToClipboard>

      {ratingActions.map((action) => (
        <button
          key={action.value}
          onClick={handleButtonClick}
          value={action.value}
          className={
            message.rating == action.value
              ? action.classNames
              : "hover:text-blue-600 disabled:text-gray-600"
          }
        >
          {action.icon}
        </button>
      ))}
    </div>
  );
}
