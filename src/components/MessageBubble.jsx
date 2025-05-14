import MessageActions from "@components/MessageActions";
import PropTypes from "prop-types";
import Avatar from "@components/Avatar";
import Typist from "react-typist-component";
import Sources from "@components/Sources";
import { useState } from "react";

// Propiedades esperadas para el componente MessageBubble
MessageBubble.propTypes = {
  message: PropTypes.object.isRequired, // El mensaje a mostrar
  setMessageRating: PropTypes.func.isRequired, // Función para establecer la calificación del mensaje
};

// Constante para controlar la velocidad de escritura en milisegundos
const TYPING_DELAY = 8;

export default function MessageBubble({ message, setMessageRating }) {
  // Desestructuración de las propiedades del mensaje
  const { id, message_type, sources, content } = message;

  // Estado para manejar si el mensaje aún está siendo escrito
  const [isTyping, setIsTyping] = useState(true);

  // Función para dividir el contenido del mensaje en párrafos y líneas
  const renderParagraphs = function (text) {
    if (text) {
      return text
        .split("\n\n") // Divide el texto en párrafos
        .map((paragraph, index) => (
          <p key={`${id}-p-${index}`}>
            {paragraph
              .split("\n") // Divide cada párrafo en líneas
              .reduce((total, line) => [
                total,
                <br key={`${id}-p-${index}-{line}`} />, // Agrega un salto de línea entre las líneas
                line,
              ])}
          </p>
        ));
    }
  };

  return (
    <div
      className={`flex ${message_type === "answer" ? "" : "flex-row-reverse"}`}
      id={`message-${id}`}
    >
      {/* Componente Avatar para mostrar el avatar del usuario o del bot */}
      <Avatar avatarType={message_type === "question" ? "user" : "bot"} />
      <div
        className={`flex max-w-prose flex-col
        gap-4 rounded-b-xl
        ${
          message_type === "answer"
            ? "rounded-tr-xl bg-blue-200 p-4 dark:bg-blue-900"
            : "rounded-tl-xl bg-slate-50 p-4 dark:bg-slate-800"
        }  sm:max-w-md md:max-w-2xl`}
      >
        {message_type === "answer" ? (
          <>
            {/* Componente Typist para simular la escritura del mensaje */}
            <Typist typingDelay={TYPING_DELAY} onTypingDone={() => setIsTyping(false)}>
              {renderParagraphs(content)}
            </Typist>
            {/* Componente Sources para mostrar las fuentes una vez que la escritura haya terminado */}
            {sources && sources.length > 0 && !isTyping && <Sources sources={sources} />}
          </>
        ) : (
          <>{renderParagraphs(content)}</>
        )}
      </div>

      {/* Componente MessageActions para permitir acciones en el mensaje (calificación) */}
      {message_type === "answer" && !isTyping && id !== "welcome" && (
        <MessageActions message={message} setMessageRating={setMessageRating} />
      )}
    </div>
  );
}
