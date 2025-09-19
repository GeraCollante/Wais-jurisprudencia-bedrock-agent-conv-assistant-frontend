import { useRouteError } from "react-router-dom";

export default function Error() {
  const error = useRouteError();

  return (
    <main id="error-page">
      <h3>¡Ups!</h3>
      <p>Lo sentimos, ha ocurrido un error inesperado.</p>
      <code>
        <i>{error.statusText || error.message}</i>
      </code>

      <footer>Desarrollado con ❤️ por WAIS</footer>
    </main>
  );
}
