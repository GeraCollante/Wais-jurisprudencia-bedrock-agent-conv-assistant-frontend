import PropTypes from "prop-types";

export default function SearchModeToggle({ searchMode, onSearchModeChange, disabled = false }) {
  const isHybrid = searchMode === "hybrid";

  return (
    <button
      type="button"
      disabled={disabled}
      onClick={() => onSearchModeChange(isHybrid ? "semantic" : "hybrid")}
      className={`
        relative inline-flex items-center rounded-full
        transition-all duration-300 ease-in-out
        ${isHybrid ? 'bg-emerald-600' : 'bg-blue-600'}
        ${disabled ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer hover:opacity-90'}
        focus:outline-none focus:ring-2 focus:ring-offset-1 focus:ring-opacity-50
        ${isHybrid ? 'focus:ring-emerald-600' : 'focus:ring-blue-600'}
        h-9 w-40 md:h-8 md:w-36
      `}
      aria-label={`Cambiar a ${isHybrid ? 'Semántico' : 'Híbrido'}`}
      title={isHybrid ? "Híbrido: BM25 + Semántico" : "Solo Semántico (embeddings)"}
    >
      {/* Label Izquierda (Semántico) */}
      <span className={`
        absolute left-0 w-1/2 text-center text-xs font-medium transition-colors duration-300 z-10
        ${!isHybrid ? 'text-blue-900' : 'text-white'}
      `}>
        Semántico
      </span>

      {/* Label Derecha (Híbrido) */}
      <span className={`
        absolute right-0 w-1/2 text-center text-xs font-medium transition-colors duration-300 z-10
        ${isHybrid ? 'text-emerald-900' : 'text-white'}
      `}>
        Híbrido
      </span>

      {/* Sliding indicator */}
      <span
        className={`
          absolute top-1 h-7 w-16 md:h-6 md:w-16
          bg-white rounded-full shadow-md
          transition-transform duration-300 ease-in-out
          z-0
          ${isHybrid ? 'translate-x-[5.5rem] md:translate-x-[4.5rem]' : 'translate-x-1'}
        `}
        aria-hidden="true"
      />
    </button>
  );
}

SearchModeToggle.propTypes = {
  searchMode: PropTypes.oneOf(['semantic', 'hybrid']).isRequired,
  onSearchModeChange: PropTypes.func.isRequired,
  disabled: PropTypes.bool,
};
