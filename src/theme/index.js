/**
 * Centralized Theme Configuration
 *
 * Cambiar colores acá y se reflejan en toda la app.
 * Los colores base están en tailwind.config.js
 */

// =============================================================================
// SIDEBAR
// =============================================================================
export const sidebar = {
  // Contenedor principal
  bg: 'bg-brand-primary-900',
  border: 'border-white/10',

  // Header
  headerBorder: 'border-white/10',

  // Botones
  button: 'bg-white/10 hover:bg-white/20',
  buttonDisabled: 'disabled:opacity-50 disabled:cursor-not-allowed',

  // Texto
  textPrimary: 'text-white',
  textSecondary: 'text-white/70',
  textMuted: 'text-white/50',

  // Items de sesión
  item: 'hover:bg-white/10 text-white/90',
  itemActive: 'bg-white/15 text-white',
  itemDisabled: 'opacity-50 cursor-not-allowed',
  itemIcon: 'text-white/70',

  // Botón eliminar
  deleteButton: 'hover:bg-white/10',
  deleteIcon: 'text-red-400',
};

// =============================================================================
// NAVBAR
// =============================================================================
export const navbar = {
  bg: 'bg-brand-bg-surface',
  text: 'text-brand-text-primary',
  menuButton: 'text-brand-primary-900 hover:bg-brand-primary-100',
  logoutButton: 'text-brand-text-primary hover:text-brand-primary-900',
};

// =============================================================================
// CHAT / MENSAJES
// =============================================================================
export const chat = {
  bg: 'bg-brand-bg-surface',
  text: 'text-brand-text-primary',
};

export const messageBubble = {
  // Respuesta del bot
  answer: {
    bg: 'bg-brand-primary-200',
    border: 'border-brand-primary-900',
    rounded: 'rounded-tr-xl rounded-b-xl',
  },
  // Pregunta del usuario
  question: {
    bg: 'bg-brand-secondary-100',
    border: 'border-brand-secondary-400',
    rounded: 'rounded-tl-xl rounded-b-xl',
  },
};

// =============================================================================
// INPUT
// =============================================================================
export const input = {
  bg: 'bg-brand-primary-200',
  border: 'border-brand-primary-900',
  text: 'text-brand-text-primary',
  placeholder: 'placeholder-brand-text-primary/60',
  focus: 'focus:ring-brand-primary-900',
  button: 'bg-brand-primary-900 hover:bg-brand-primary-900/90 text-brand-text-light',
  buttonDisabled: 'disabled:bg-brand-secondary-100 disabled:text-brand-text-primary/50',
};

// =============================================================================
// TABLAS (en markdown)
// =============================================================================
export const table = {
  wrapper: 'rounded-lg shadow-sm',
  header: 'bg-brand-primary-900 text-white',
  body: 'bg-white',
  row: 'border-b border-brand-primary-100 even:bg-brand-primary-50',
  cell: 'px-4 py-3',
  headerCell: 'px-4 py-3 text-left font-semibold',
};

// =============================================================================
// ESTADOS
// =============================================================================
export const states = {
  loading: 'text-white/70',
  error: 'text-red-400',
  success: 'text-green-400',
};

// Export default con todo
export default {
  sidebar,
  navbar,
  chat,
  messageBubble,
  input,
  table,
  states,
};
