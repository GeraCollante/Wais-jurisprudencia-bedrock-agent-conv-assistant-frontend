import { useState, useRef, useContext } from "react";
import PropTypes from "prop-types";
import { nanoid } from "nanoid";
import { useTranslation } from "react-i18next";

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
    sendMessage({
      id: nanoid(),
      content: trimmed,
      message_type: "question",
    });
    setPrompt("");
  };

  return (
    <form className="mt-2" onSubmit={handleSubmit}>
      <div className="relative">
        <textarea
          id="prompt-input"
          ref={promptInput}
          rows="1"
          value={prompt}
          onChange={({ target }) => setPrompt(target.value)}
          onKeyDown={onPressEnter}
          disabled={isLoading}
          placeholder={
            isLoading ? t("Loading...") : t("Write your question here")
          }
          className="
            block w-full resize-none rounded-xl border
            bg-brand-bluegray-soft text-brand-black placeholder-brand-black/60 /* Fondo C, Texto F, Placeholder F con opacidad */
            border-brand-blue-deep /* Borde E */
            p-5 pr-20 text-sm
            focus:outline-none focus:ring-2 focus:ring-offset-1 focus:ring-brand-blue-deep /* Anillo de foco E, con offset */
            disabled:bg-brand-bluegray-soft/70 disabled:text-brand-black/70 disabled:border-brand-blue-deep/70 /* Estado deshabilitado */
            sm:text-base
          "
        />
        <button
          type="submit"
          disabled={isLoading}
          className="
            absolute right-2.5 bottom-3 rounded-full
            bg-brand-blue-deep px-4 py-2 text-sm font-medium text-brand-white /* Fondo E, Texto A */
            hover:bg-brand-blue-deep/90 /* Hover sobre E */
            focus:outline-none focus:ring-2 focus:ring-offset-1 focus:ring-brand-blue-deep/80 /* Anillo de foco E más claro, con offset */
            disabled:bg-brand-gray-light disabled:text-brand-black/50 /* Deshabilitado: Fondo B, Texto F con opacidad */
            sm:text-base
          "
        >
          {isLoading ? (
            <svg
              className="h-6 w-6 animate-spin text-brand-white" /* Icono del spinner A */
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
    </form>
  );
}