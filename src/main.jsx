import React from "react";
import ReactDOM from "react-dom/client";
import { Authenticator } from "@aws-amplify/ui-react";
import {
  createBrowserRouter,
  RouterProvider,
  createRoutesFromElements,
  Route,
} from "react-router-dom";

import "./index.css";
import "./api";
import './i18n'; // initialize i18n

import Root from "@routes/Root";
import Chat from "@routes/Chat";
import Error from "@routes/Error";

const router = createBrowserRouter(
  createRoutesFromElements(
    <Route path="/" element={<Root />} errorElement={<Error />}>
      <Route index element={<Chat />} />
    </Route>
  )
);

ReactDOM.createRoot(document.getElementById("root")).render(
  <React.StrictMode>
    <Authenticator hideSignUp={true}>
      <RouterProvider router={router} />
    </Authenticator>
  </React.StrictMode>
);
