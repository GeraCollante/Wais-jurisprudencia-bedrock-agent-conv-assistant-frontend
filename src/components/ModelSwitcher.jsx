import PropTypes from "prop-types";

export default function ModelSwitcher({ selectedModel, onModelChange, disabled = false }) {
  const isGrok = selectedModel === "grok";

  return (
    <button
      type="button"
      disabled={disabled}
      onClick={() => onModelChange(isGrok ? "sonnet" : "grok")}
      className={`
        relative inline-flex items-center rounded-full
        transition-all duration-300 ease-in-out
        ${isGrok ? 'bg-black' : 'bg-[#FF6B35]'}
        ${disabled ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer hover:opacity-90'}
        focus:outline-none focus:ring-2 focus:ring-offset-1 focus:ring-opacity-50
        ${isGrok ? 'focus:ring-black' : 'focus:ring-[#FF6B35]'}
        h-9 w-48 md:h-8 md:w-44
      `}
      aria-label={`Cambiar a ${isGrok ? 'Sonnet 4.5' : 'Grok 4.1'}`}
    >
      {/* Label Izquierda (Grok) - z-10 para estar sobre el indicador */}
      <span className={`
        absolute left-0 w-1/2 text-center text-xs font-medium transition-colors duration-300 z-10
        ${isGrok ? 'text-black' : 'text-white'}
      `}>
        Grok 4.1
      </span>

      {/* Label Derecha (Sonnet) - z-10 para estar sobre el indicador */}
      <span className={`
        absolute right-0 w-1/2 text-center text-xs font-medium transition-colors duration-300 z-10
        ${!isGrok ? 'text-[#D84315]' : 'text-white'}
      `}>
        Sonnet 4.5
      </span>

      {/* Sliding indicator - z-0 para quedar detrás del texto */}
      <span
        className={`
          absolute top-1 h-7 w-20 md:h-6 md:w-20
          bg-white rounded-full shadow-md
          transition-transform duration-300 ease-in-out
          z-0
          ${isGrok ? 'translate-x-1' : 'translate-x-[6.5rem] md:translate-x-[5.75rem]'}
        `}
        aria-hidden="true"
      />
    </button>
  );
}

// PropTypes definido DESPUÉS de la función (buena práctica)
ModelSwitcher.propTypes = {
  selectedModel: PropTypes.string.isRequired,
  onModelChange: PropTypes.func.isRequired,
  disabled: PropTypes.bool,
};
