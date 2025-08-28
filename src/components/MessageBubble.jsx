import MessageActions from "@components/MessageActions";
import PropTypes from "prop-types";
import Avatar from "@components/Avatar";
import Typist from "react-typist-component";
import Sources from "@components/Sources";
import ReactMarkdown from "react-markdown";
import { useState, useEffect } from "react";

// Propiedades esperadas para el componente MessageBubble
MessageBubble.propTypes = {
  message: PropTypes.object.isRequired,
  setMessageRating: PropTypes.func.isRequired,
};

// Constante para controlar la velocidad de escritura en milisegundos
const TYPING_DELAY = 8;

// Componente personalizado para efecto typing con formateo correcto
function TypedMarkdown({ text, onComplete, className = "" }) {
  const [displayedLines, setDisplayedLines] = useState(0);
  const lines = text.split('\n');
  
  useEffect(() => {
    if (displayedLines < lines.length) {
      const timer = setTimeout(() => {
        setDisplayedLines(prev => prev + 1);
      }, 80); // 80ms por línea - más rápido pero suave
      
      return () => clearTimeout(timer);
    } else if (onComplete) {
      // Pequeño delay antes de marcar como completado
      const completeTimer = setTimeout(onComplete, 200);
      return () => clearTimeout(completeTimer);
    }
  }, [displayedLines, lines.length, onComplete]);

  const visibleText = lines.slice(0, displayedLines).join('\n');
  
  return (
    <div className={className}>
      <ReactMarkdown
        components={{
          strong: ({ children }) => <strong>{children}</strong>,
          p: ({ children }) => <>{children}</>,
          br: () => <br />,
        }}
      >
        {visibleText}
      </ReactMarkdown>
    </div>
  );
}

export default function MessageBubble({ message, setMessageRating }) {
  const { id, message_type, sources, content } = message;
  // isTyping se inicializa a true para respuestas que no sean de bienvenida, para activar Typist.
  // Se pondrá a false cuando Typist termine.
  const [isTyping, setIsTyping] = useState(message_type === "answer" && id !== "welcome");

  // Función para renderizar texto con ReactMarkdown (sin conflicto con Typist)
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
  const bubbleContainerBaseClasses = "rounded-b-xl p-4 text-brand-text-primary"; // Texto primary para ambas burbujas

  const bubbleContainerSpecificClasses = isAnswer
    ? "rounded-tr-xl bg-brand-primary-200 border border-brand-primary-900" // Chatbot: Fondo primary-200, Borde primary-900
    : "rounded-tl-xl bg-brand-secondary-100 border border-brand-secondary-400";  // Usuario: Fondo secondary-100, Borde secondary-400

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
              // Para el mensaje de bienvenida, usar ReactMarkdown directamente
              renderParagraphs(content)
            ) : isTyping ? (
              // Usar nuestro componente personalizado que maneja typing + formateo
              <TypedMarkdown 
                text={content}
                onComplete={() => setIsTyping(false)}
                className="whitespace-pre-wrap text-brand-text-primary"
              />
            ) : (
              // Cuando terminó: mostrar completo (ya formateado por TypedMarkdown)
              renderParagraphs(content)
            )}
            {/* Mostrar el componente Sources si no está escribiendo y hay fuentes */}
            {!isTyping && sources?.length > 0 && <Sources sources={sources} />}
            
          </>
        ) : (
          // Para mensajes de pregunta (usuario), usar ReactMarkdown
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