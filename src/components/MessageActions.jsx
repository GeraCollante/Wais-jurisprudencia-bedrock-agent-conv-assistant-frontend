import PropTypes from "prop-types";
import { useState } from "react";
import { CopyToClipboard } from "react-copy-to-clipboard";
import {
  IconCopy,
  IconCheck,
  // Los siguientes iconos ya no son necesarios:
  // IconThumbDown,
  // IconThumbUp,
} from "@tabler/icons-react";

MessageActions.propTypes = {
  message: PropTypes.object.isRequired,
  // La prop setMessageRating ya no es utilizada por este componente,
  // podrías eliminarla de aquí y de donde se llama a <MessageActions />
  // si quieres una limpieza completa. La dejo por si acaso, pero no tiene efecto.
  setMessageRating: PropTypes.func, // Cambiado a .func en lugar de .isRequired si ya no es esencial
};

export default function MessageActions({ message /*, setMessageRating (ya no se usa) */ }) {
  const [isCopied, setIsCopied] = useState(false);

  const handleCopy = () => {
    setIsCopied(true);
    setTimeout(() => setIsCopied(false), 800);
  };

  // La función handleButtonClick y el array ratingActions han sido eliminados
  // ya que no se usan para la funcionalidad de rating.

  return (
    <div className="ml-2 mt-1 flex text-brand-black"> {/* Eliminado gap-2 si solo hay un botón */}
      <CopyToClipboard text={message.content} onCopy={handleCopy}>
        <button 
          className="hover:text-brand-blue-deep focus:outline-none focus-visible:ring-2 focus-visible:ring-brand-blue-deep focus-visible:ring-offset-1" 
          aria-label="Copiar mensaje"
        >
          {isCopied ? (
            <IconCheck className="w-5 text-brand-blue-deep" />
          ) : (
            <IconCopy className="w-5" />
          )}
        </button>
      </CopyToClipboard>
    </div>
  );
}