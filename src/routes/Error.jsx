import { useRouteError } from "react-router-dom";

export default function Error() {
  const error = useRouteError();

  return (
    <main id="error-page">
      <h3>Oops!</h3>
      <p>Sorry, an unexpected error has occurred.</p>
      <code>
        <i>{error.statusText || error.message}</i>
      </code>

      <footer>Built with ❤️ by WAIS</footer>
    </main>
  );
}
