import { useAuthenticator } from "@aws-amplify/ui-react";
import { IconLogout } from "@tabler/icons-react"; // IconMessageChatbot ya no se usa aquí
import Avatar from "./Avatar";

// Opcional: Importa las imágenes si no están en `public` y tu bundler lo soporta
import logoMinisterio from "../assets/tribunal_justicia.png";
import logoWais from "../assets/wais_jurisprudencia.png";

export default function NavBar() {
  const { signOut } = useAuthenticator((ctx) => [ctx.user]);
  // const env = import.meta.env; // Ya no se usan directamente estas variables de entorno para los logos aquí
  // const appName = env.VITE_APP_NAME || "IBS Assistant";
  // const appLogoUrl = env.VITE_APP_LOGO_URL;

  return (
    <nav
      className="
        mb-1 flex items-center justify-between
        bg-brand-white text-brand-black p-4 shadow-md
      "
    >
      {/* Sección Izquierda: Logo Ministerio */}
      <div className="flex items-center">
        <img 
          src={logoMinisterio} //"/ministerio_justicia.webp" // O usa la variable importada: src={logoMinisterio}
          alt="Logo Ministerio de Justicia" 
          className="h-10" // Ajusta la altura según necesites
        />
      </div>

      {/* Sección Central: Logo WAIS */}
      {/* Para centrar, el div padre (nav) usa justify-between. 
          Necesitamos asegurarnos de que las secciones izquierda y derecha tengan un ancho 
          comparable o usar flex-grow en el centro, o un div vacío para equilibrar.
          Una forma simple es que las secciones laterales tengan un flex-basis o width.
          Aquí, como solo hay 3 elementos principales (izquierda, centro, derecha) 
          y el padre es flex con justify-between, el del medio se centrará si 
          los otros dos no ocupan todo el espacio.
      */}
      <div className="flex-grow flex justify-center"> {/* Contenedor para centrar el logo WAIS */}
        <img 
          src={logoWais}//"/wais.png" // O usa la variable importada: src={logoWais}
          alt="Logo WAIS" 
          className="h-8" // Ajusta la altura según necesites
        />
      </div>
      

      {/* Sección Derecha: Avatar y Logout */}
      <div className="flex items-center space-x-4">
        <Avatar size="small" avatarType="user" />
        <button
          onClick={signOut}
          className="
            text-brand-black hover:text-brand-blue-deep
            focus:outline-none focus:ring-2 focus:ring-brand-blue-deep
          "
          aria-label="Cerrar sesión" // Añadido aria-label para accesibilidad
        >
          <IconLogout size={20} />
        </button>
      </div>
    </nav>
  );
}