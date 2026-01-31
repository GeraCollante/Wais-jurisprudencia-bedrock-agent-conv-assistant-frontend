import { useState, useRef, useContext } from "react";
import PropTypes from "prop-types";
import { useTranslation } from "react-i18next";
import { input as inputTheme } from '../theme';

InputPrompt.propTypes = {
  sendMessage: PropTypes.func.isRequired,
  LoaderContext: PropTypes.object.isRequired,
};

export default function InputPrompt({ sendMessage, LoaderContext }) {
  const { t } = useTranslation();
  const [prompt, setPrompt] = useState("");
  const promptInput = useRef(null);
  const isLoading = useContext(LoaderContext);

  const onPressEnter = (e) => {
    if (e.keyCode === 13 && !e.shiftKey) handleSubmit(e);
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    const trimmed = prompt.trim();
    if (!trimmed) return;
    const timestamp = Date.now();
    sendMessage({
      id: `${timestamp}_q`,
      content: trimmed,
      message_type: "question",
      timestamp: timestamp,
    });
    setPrompt("");
  };

  return (
    <form className="font-sans" onSubmit={handleSubmit}>
      <div className="relative">
        <textarea
          id="prompt-input"
          ref={promptInput}
          rows="2"
          value={prompt}
          onChange={({ target }) => setPrompt(target.value)}
          onKeyDown={onPressEnter}
          disabled={isLoading}
          placeholder={
            isLoading ? t("Loading...") : t("Write your question here")
          }
          style={{ fontSize: '16px' }}
          className={`
            block w-full resize-none rounded-xl border font-sans
            ${inputTheme.bg} ${inputTheme.text} ${inputTheme.placeholder}
            ${inputTheme.border}
            p-4 md:p-5 pr-16 md:pr-20 text-base md:text-sm min-h-[44px]
            focus:outline-none focus:ring-2 focus:ring-offset-1 ${inputTheme.focus}
            disabled:bg-brand-primary-200/70 disabled:text-brand-text-primary/70 disabled:border-brand-primary-900/70
          `}
        />
        <div className="absolute right-2 md:right-2.5 bottom-2 md:bottom-3 flex items-center">
          <button
            type="submit"
            disabled={isLoading}
            className={`
              rounded-full font-sans
              ${inputTheme.button} px-3 py-2 md:px-4 md:py-2 text-sm font-medium
              focus:outline-none focus:ring-2 focus:ring-offset-1 focus:ring-brand-primary-900/80
              ${inputTheme.buttonDisabled}
              min-h-[44px] md:min-h-0 min-w-[44px] md:min-w-0 flex items-center justify-center
            `}
          >
            {isLoading ? (
              <svg
                className="h-6 w-6 animate-spin text-brand-white"
                xmlns="http://www.w3.org/2000/svg"
                fill="none"
                viewBox="0 0 24 24"
              >
                <circle
                  className="opacity-25"
                  cx="12"
                  cy="12"
                  r="10"
                  stroke="currentColor"
                  strokeWidth="4"
                />
                <path
                  className="opacity-75"
                  fill="currentColor"
                  d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                />
              </svg>
            ) : (
              t("Send")
            )}
            <span className="sr-only">{t("Send message")}</span>
          </button>
        </div>
      </div>
    </form>
  );
}
