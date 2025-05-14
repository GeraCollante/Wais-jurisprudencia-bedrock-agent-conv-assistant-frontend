import MessageActions from "@components/MessageActions";
import PropTypes from "prop-types";
import Avatar from "@components/Avatar";
import Typist from "react-typist-component";
import Sources from "@components/Sources"; // Usaremos este componente para mostrar las fuentes
import { useState } from "react";

// Propiedades esperadas para el componente MessageBubble
MessageBubble.propTypes = {
  message: PropTypes.object.isRequired,
  setMessageRating: PropTypes.func.isRequired,
};

// Constante para controlar la velocidad de escritura en milisegundos
const TYPING_DELAY = 8;

export default function MessageBubble({ message, setMessageRating }) {
  const { id, message_type, sources, content } = message;
  // isTyping se inicializa a true para respuestas que no sean de bienvenida, para activar Typist.
  // Se pondrá a false cuando Typist termine.
  const [isTyping, setIsTyping] = useState(message_type === "answer" && id !== "welcome");

  const renderParagraphs = (text) => {
    if (!text) return null;
    return text.split("\n\n").map((para, pi) => (
      <p key={`${id}-p-${pi}`} className="whitespace-pre-wrap">
        {para.split("\n").reduce((acc, line, li) => [
          ...acc,
          li > 0 && <br key={`${id}-p-${pi}-br-${li}`} />,
          line,
        ], [])}
      </p>
    ));
  };

  // Clases para el contenedor de la burbuja
  const isAnswer = message_type === "answer";
  const bubbleContainerBaseClasses = "rounded-b-xl p-4 text-brand-black"; // Texto F para ambas burbujas

  const bubbleContainerSpecificClasses = isAnswer
    ? "rounded-tr-xl bg-brand-bluegray-soft border border-brand-blue-deep" // Chatbot: Fondo C, Borde E
    : "rounded-tl-xl bg-brand-gray-light border border-brand-gray-dark";  // Usuario: Fondo B, Borde D

  return (
    <div
      className={`flex ${isAnswer ? "flex-row" : "flex-row-reverse"} gap-2`}
      id={`message-${id}`}
    >
      <Avatar avatarType={message_type === "question" ? "user" : "bot"} />

      <div 
        className={`flex max-w-prose flex-col gap-4 ${bubbleContainerBaseClasses} ${bubbleContainerSpecificClasses} sm:max-w-md md:max-w-2xl`}
      >
        {isAnswer ? (
          <>
            {id === "welcome" ? ( 
              // Para el mensaje de bienvenida, renderizar directamente sin efecto Typist
              renderParagraphs(content)
            ) : (
              // Para otras respuestas, usar Typist
              <Typist 
                typingDelay={TYPING_DELAY} 
                // cursor={<span className='ml-1'>▋</span>} // PROP CURSOR ELIMINADA
                onTypingDone={() => setIsTyping(false)}
              >
                {renderParagraphs(content)}
              </Typist>
            )}
            {/* Mostrar el componente Sources si no está escribiendo y hay fuentes */}
            {!isTyping && sources?.length > 0 && <Sources sources={sources} />}
            
          </>
        ) : (
          // Para mensajes de pregunta (usuario), solo renderizar el contenido
          renderParagraphs(content)
        )}
      </div>

      {/* Mostrar acciones del mensaje para respuestas (no bienvenida) cuando Typist ha terminado */}
      {isAnswer && !isTyping && id !== "welcome" && (
        <MessageActions message={message} setMessageRating={setMessageRating} />
      )}
    </div>
  );
}