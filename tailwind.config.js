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
        // Primary Color Palette (Blue-based)
        "brand-primary": {
          50: "#f0f4fc",  // Very light blue
          100: "#e3e9f7", // Light blue
          200: "#c3d7ee", // Light blue (existing gray-light)
          300: "#a3c1e5", // Soft blue
          400: "#83a9db", // Medium blue
          500: "#6391d1", // Primary blue
          600: "#4d7ac8", // Darker blue
          700: "#3763bf", // Deep blue
          800: "#214bb6", // Very deep blue
          900: "#1C2D4A"  // Original brand-blue-deep
        },
        
        // Secondary Color Palette (Gray-based)
        "brand-secondary": {
          50: "#f8f9fa",  // Very light gray
          100: "#f1f3f5", // Light gray
          200: "#e9ecef", // Soft gray
          300: "#dee2e6", // Medium gray
          400: "#ced4da", // Dark gray
          500: "#adb5bd", // Deep gray
          600: "#868e96", // Very deep gray
          700: "#495057", // Darker gray
          800: "#343a40", // Dark gray
          900: "#212529"  // Very dark gray
        },
        
        // Accent Colors
        "brand-accent": {
          "success": "#28a745",
          "warning": "#ffc107",
          "danger": "#dc3545",
          "info": "#17a2b8"
        },
        
        // Text Colors
        "brand-text": {
          "primary": "#212529",
          "secondary": "#6c757d",
          "muted": "#adb5bd",
          "light": "#f8f9fa",
          "dark": "#1C2D4A"
        },
        
        // Background Colors
        "brand-bg": {
          "surface": "#ffffff",
          "elevation-1": "#f8f9fa",
          "elevation-2": "#f1f3f5",
          "elevation-3": "#e9ecef",
          "elevation-4": "#dee2e6",
          "card": "#ffffff"
        }

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