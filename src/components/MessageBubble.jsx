import MessageActions from "@components/MessageActions";
import PropTypes from "prop-types";
import Avatar from "@components/Avatar";
import Sources from "@components/Sources";
import ReactMarkdown from "react-markdown";

// Propiedades esperadas para el componente MessageBubble
MessageBubble.propTypes = {
  message: PropTypes.object.isRequired,
  setMessageRating: PropTypes.func.isRequired,
};

export default function MessageBubble({ message, setMessageRating }) {
  const { id, message_type, sources, content, isStreaming } = message;

  // Función para renderizar texto con ReactMarkdown
  const renderFormattedText = (text) => {
    if (!text) return null;
    
    return (
      <ReactMarkdown
        components={{
          // **texto** → negrita
          strong: ({ children }) => <strong>{children}</strong>,
          // Evitar <p> anidados - renderizar como fragmento
          p: ({ children }) => <>{children}</>,
          // Manejar breaks de línea
          br: () => <br />,
        }}
      >
        {text}
      </ReactMarkdown>
    );
  };

  const renderParagraphs = (text) => {
    if (!text) return null;
    return text.split("\n\n").map((para, pi) => (
      <div key={`${id}-p-${pi}`} className="whitespace-pre-wrap text-brand-text-primary">
        {renderFormattedText(para)}
      </div>
    ));
  };

  // Clases para el contenedor de la burbuja
  const isAnswer = message_type === "answer";
  const bubbleContainerBaseClasses = "rounded-b-xl p-3 md:p-4 text-brand-text-primary"; // Texto primary para ambas burbujas

  const bubbleContainerSpecificClasses = isAnswer
    ? "rounded-tr-xl bg-brand-primary-200 border border-brand-primary-900" // Chatbot: Fondo primary-200, Borde primary-900
    : "rounded-tl-xl bg-brand-secondary-100 border border-brand-secondary-400";  // Usuario: Fondo secondary-100, Borde secondary-400

  return (
    <div
      className={`flex items-start ${isAnswer ? "flex-row" : "flex-row-reverse"} gap-2`}
      id={`message-${id}`}
    >
      <div className="flex justify-center md:block">
        <Avatar avatarType={message_type === "question" ? "user" : "bot"} size="small" />
      </div>

      <div 
        className={`flex max-w-[95%] md:max-w-[85%] lg:max-w-[80%] xl:max-w-prose flex-col gap-3 md:gap-4 min-w-0 overflow-hidden ${bubbleContainerBaseClasses} ${bubbleContainerSpecificClasses}`}
      >
        {isAnswer ? (
          <>
            {/* Renderizar contenido - durante streaming se actualiza en tiempo real */}
            <div className="whitespace-pre-wrap text-brand-text-primary">
              {renderFormattedText(content)}
            </div>
            {/* Mostrar Sources cuando no está en streaming y hay fuentes */}
            {!isStreaming && sources?.length > 0 && <Sources sources={sources} />}
          </>
        ) : (
          // Para mensajes de pregunta (usuario), usar ReactMarkdown
          renderParagraphs(content)
        )}
      </div>

      {/* Mostrar acciones del mensaje para respuestas (no bienvenida) cuando no está streaming */}
      {isAnswer && !isStreaming && id !== "welcome" && (
        <div className="flex justify-center md:block mt-2 md:mt-0">
          <MessageActions message={message} setMessageRating={setMessageRating} />
        </div>
      )}
    </div>
  );
}