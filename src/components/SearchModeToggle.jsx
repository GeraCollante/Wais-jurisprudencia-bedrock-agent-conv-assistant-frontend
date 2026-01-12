import PropTypes from "prop-types";

export default function SearchModeToggle({ searchMode, onSearchModeChange, disabled = false }) {
  const isBM25 = searchMode === "bm25";

  return (
    <button
      type="button"
      disabled={disabled}
      onClick={() => onSearchModeChange(isBM25 ? "semantic" : "bm25")}
      className={`
        relative inline-flex items-center rounded-full
        transition-all duration-300 ease-in-out
        ${isBM25 ? 'bg-amber-600' : 'bg-blue-600'}
        ${disabled ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer hover:opacity-90'}
        focus:outline-none focus:ring-2 focus:ring-offset-1 focus:ring-opacity-50
        ${isBM25 ? 'focus:ring-amber-600' : 'focus:ring-blue-600'}
        h-9 w-40 md:h-8 md:w-36
      `}
      aria-label={`Cambiar a ${isBM25 ? 'Semántico' : 'BM25'}`}
      title={isBM25 ? "BM25: Búsqueda por keywords exactos" : "Semántico: Búsqueda por significado"}
    >
      {/* Label Izquierda (Semántico) */}
      <span className={`
        absolute left-0 w-1/2 text-center text-xs font-medium transition-colors duration-300 z-10
        ${!isBM25 ? 'text-blue-900' : 'text-white'}
      `}>
        Semántico
      </span>

      {/* Label Derecha (BM25) */}
      <span className={`
        absolute right-0 w-1/2 text-center text-xs font-medium transition-colors duration-300 z-10
        ${isBM25 ? 'text-amber-900' : 'text-white'}
      `}>
        BM25
      </span>

      {/* Sliding indicator */}
      <span
        className={`
          absolute top-1 h-7 w-16 md:h-6 md:w-16
          bg-white rounded-full shadow-md
          transition-transform duration-300 ease-in-out
          z-0
          ${isBM25 ? 'translate-x-[5.5rem] md:translate-x-[4.5rem]' : 'translate-x-1'}
        `}
        aria-hidden="true"
      />
    </button>
  );
}

SearchModeToggle.propTypes = {
  searchMode: PropTypes.oneOf(['semantic', 'bm25']).isRequired,
  onSearchModeChange: PropTypes.func.isRequired,
  disabled: PropTypes.bool,
};
