// src/i18n.js
import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';

const env = import.meta.env; // Vite environment variables

import translationES from './locales/es/translations.json';
import translationPTBR from './locales/pt-BR/translations.json';

// the translations
const resources = {
  es: {
    translation: translationES
  },
  "pt-BR": {
    translation: translationPTBR
  }
};

i18n
  .use(initReactI18next) // passes i18n down to react-i18next
  .init({
    resources,
    lng: env.VITE_I18N_LANGUAGE, // default language
    fallbackLng: "es",
    keySeparator: false, // we do not use keys in form messages.welcome
    interpolation: {
      escapeValue: false // react already safes from xss
    }
  });

export default i18n;
