import React from "react";
import ReactDOM from "react-dom/client";
import { Authenticator } from "@aws-amplify/ui-react";
import { I18n } from 'aws-amplify';
import {
  createBrowserRouter,
  RouterProvider,
  createRoutesFromElements,
  Route,
} from "react-router-dom";

import "./index.css";
import "./api";
import './i18n'; // initialize i18n
import { amplifyTranslationsES } from './amplify-translations';

import Root from "@routes/Root";
import Chat from "@routes/Chat";
import Error from "@routes/Error";

// Configurar Amplify I18n en español
I18n.putVocabularies({
  es: amplifyTranslationsES
});
I18n.setLanguage('es');

// Definir un booleano para permitir o no el uso de StrictMode
const useStrictMode = false; // Cambia a false para deshabilitar StrictMode

const router = createBrowserRouter(
  createRoutesFromElements(
    <Route path="/" element={<Root />} errorElement={<Error />}>
      <Route index element={<Chat />} />
    </Route>
  )
);

const app = (
  <Authenticator hideSignUp={true}>
    <RouterProvider router={router} />
  </Authenticator>
);

ReactDOM.createRoot(document.getElementById("root")).render(
  useStrictMode ? <React.StrictMode>{app}</React.StrictMode> : app
);