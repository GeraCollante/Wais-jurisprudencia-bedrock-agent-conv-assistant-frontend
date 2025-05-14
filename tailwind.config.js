/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{js,ts,jsx,tsx}"],
  theme: {
    extend: {
      fontFamily: {
        sans: [ // Tu fuente sans-serif actual se mantiene
          "Amazon Ember",
          "ui-sans-serif",
          "system-ui",
          "-apple-system",
          "BlinkMacSystemFont",
          "Segoe UI",
          "Roboto",
          "Helvetica Neue",
          "Arial",
          "Noto Sans",
          "sans-serif",
          "Apple Color Emoji",
          "Segoe UI Emoji",
          "Segoe UI Symbol",
          "Noto Color Emoji",
        ],
        merriweather: ['Merriweather', 'serif'], // <-- AÑADE ESTA LÍNEA
        // O, si prefieres usar 'font-serif' como la clase de Tailwind:
        // serif: ['Merriweather', 'Georgia', 'Times New Roman', 'serif'],
      },
      colors: {
        // Nueva Paleta de Colores Definida
        "brand-white": "#FFFFFF",          // A: Blanco puro
        "brand-gray-light": "#c3d7ee",    // B: Gris claro
        "brand-bluegray-soft": "#BFCED6", // C: Gris azulado suave
        "brand-gray-dark": "#AAAAAA",     // D: Gris oscuro
        "brand-blue-deep": "#1C2D4A",     // E: Azul noche profundo
        "brand-black": "#000000",         // F: Negro puro

        // Colores anteriores (puedes decidir si mantenerlos o eliminarlos si ya no se usan)
        // "logo-blue": "#2673B3",
        // "logo-grey": "#5C5C5C",
        // "logo-white": "#FFFFFF", // Duplicado por brand-white, se puede eliminar
        // "input-prompt-blue": "#A8D0F0", // Reemplazado por la nueva paleta
      },
    },
  },
  plugins: [],
};