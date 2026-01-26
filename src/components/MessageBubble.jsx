import MessageActions from "@components/MessageActions";
import PropTypes from "prop-types";
import Avatar from "@components/Avatar";
import Sources from "@components/Sources";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";

// Toggle para mostrar/ocultar fuentes en las respuestas
const SHOW_SOURCES = false;  // Cambiar a true para mostrar fuentes

// Propiedades esperadas para el componente MessageBubble
MessageBubble.propTypes = {
  message: PropTypes.object.isRequired,
  setMessageRating: PropTypes.func.isRequired,
};

export default function MessageBubble({ message, setMessageRating }) {
  const { id, message_type, sources, content, isStreaming } = message;

  // Función para renderizar texto con ReactMarkdown completo
  const renderFormattedText = (text) => {
    if (!text) return null;

    return (
      <ReactMarkdown
        remarkPlugins={[remarkGfm]}
        components={{
          // Headers
          h1: ({ children }) => <h1 className="text-xl font-bold mt-4 mb-2">{children}</h1>,
          h2: ({ children }) => <h2 className="text-lg font-bold mt-3 mb-2">{children}</h2>,
          h3: ({ children }) => <h3 className="text-base font-bold mt-2 mb-1">{children}</h3>,
          // Párrafos
          p: ({ children }) => <p className="mb-2">{children}</p>,
          // Listas
          ul: ({ children }) => <ul className="list-disc list-inside ml-2 mb-2 space-y-1">{children}</ul>,
          ol: ({ children }) => <ol className="list-decimal list-inside ml-2 mb-2 space-y-1">{children}</ol>,
          li: ({ children }) => <li className="text-brand-text-primary">{children}</li>,
          // Negrita e itálica
          strong: ({ children }) => <strong className="font-bold">{children}</strong>,
          em: ({ children }) => <em className="italic">{children}</em>,
          // Código
          code: ({ children }) => <code className="bg-gray-200 px-1 rounded text-sm">{children}</code>,
          pre: ({ children }) => <pre className="bg-gray-100 p-2 rounded overflow-x-auto mb-2">{children}</pre>,
          // Links
          a: ({ href, children }) => <a href={href} className="text-blue-600 underline" target="_blank" rel="noopener noreferrer">{children}</a>,
          // Separador
          hr: () => <hr className="my-3 border-gray-300" />,
          // Blockquote
          blockquote: ({ children }) => <blockquote className="border-l-4 border-gray-400 pl-3 italic my-2">{children}</blockquote>,
          // Tablas
          table: ({ children }) => (
            <div className="overflow-x-auto my-3 rounded-lg shadow-sm">
              <table className="min-w-full text-sm">
                {children}
              </table>
            </div>
          ),
          thead: ({ children }) => <thead className="bg-brand-primary-900 text-white">{children}</thead>,
          tbody: ({ children }) => <tbody className="bg-white">{children}</tbody>,
          tr: ({ children }) => <tr className="border-b border-brand-primary-100 even:bg-brand-primary-50">{children}</tr>,
          th: ({ children }) => <th className="px-4 py-3 text-left font-semibold">{children}</th>,
          td: ({ children }) => <td className="px-4 py-3 text-brand-text-primary">{children}</td>,
        }}
      >
        {text}
      </ReactMarkdown>
    );
  };

  // Clases para el contenedor de la burbuja
  const isAnswer = message_type === "answer";
  const bubbleContainerBaseClasses = "rounded-b-xl p-3 md:p-4 text-brand-text-primary";

  const bubbleContainerSpecificClasses = isAnswer
    ? "rounded-tr-xl bg-brand-primary-200 border border-brand-primary-900"
    : "rounded-tl-xl bg-brand-secondary-100 border border-brand-secondary-400";

  return (
    <div
      className={`flex items-start ${isAnswer ? "flex-row" : "flex-row-reverse"} gap-2`}
      id={`message-${id}`}
    >
      <div className="flex justify-center md:block">
        <Avatar avatarType={message_type === "question" ? "user" : "bot"} size="small" />
      </div>

      <div
        className={`flex max-w-[95%] md:max-w-[85%] lg:max-w-[80%] xl:max-w-prose flex-col gap-2 min-w-0 overflow-hidden ${bubbleContainerBaseClasses} ${bubbleContainerSpecificClasses}`}
      >
        {isAnswer ? (
          <>
            <div className="prose prose-sm max-w-none text-brand-text-primary">
              {renderFormattedText(content)}
            </div>
            {SHOW_SOURCES && !isStreaming && sources?.length > 0 && <Sources sources={sources} />}
          </>
        ) : (
          <div className="whitespace-pre-wrap text-brand-text-primary">
            {content}
          </div>
        )}
      </div>

      {isAnswer && !isStreaming && id !== "welcome" && (
        <div className="flex justify-center md:block mt-2 md:mt-0">
          <MessageActions message={message} setMessageRating={setMessageRating} />
        </div>
      )}
    </div>
  );
}
