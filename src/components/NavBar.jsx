import { useAuthenticator } from "@aws-amplify/ui-react";
import { IconLogout } from "@tabler/icons-react"; // IconMessageChatbot ya no se usa aquí
import Avatar from "./Avatar";

// Opcional: Importa las imágenes si no están en `public` y tu bundler lo soporta
import logoMinisterio from "../assets/logo-horizontal.svg";
import logoFAM from "../assets/fam.png";
import logoWais from "../assets/wais_jurisprudencia.png";

export default function NavBar() {
  const { signOut } = useAuthenticator((ctx) => [ctx.user]);
  // const env = import.meta.env; // Ya no se usan directamente estas variables de entorno para los logos aquí
  // const appName = env.VITE_APP_NAME || "IBS Assistant";
  // const appLogoUrl = env.VITE_APP_LOGO_URL;

  return (
    <>
    <nav
      className="
        mb-1 relative flex items-center justify-between
        bg-brand-bg-surface text-brand-text-primary py-8 shadow-md
      "
    >
      {/* Sección Izquierda: Logo Ministerio + FAM */}
      <div className="flex items-center space-x-4">
        <img 
          src={logoMinisterio}
          alt="Logo Ministerio de Justicia"
          className="h-20"
        />
        <img 
          src={logoFAM}
          alt="Logo FAM"
          className="h-24"
        />
      </div>

      {/* Sección Central: Logo WAIS (centrado absoluto) */}
      <div className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 flex flex-col justify-center items-center pointer-events-none" style={{zIndex:1, width:'fit-content'}}>
        <img 
          src={logoWais}
          alt="Logo WAIS"
          className="h-10"
        />
        <span style={{ fontFamily: 'Arial, sans-serif' }} className="mt-1 text-xs text-brand-text-muted text-center">
          Realizado por Wais
        </span>
      </div>
      

      {/* Sección Derecha: Avatar y Logout */}
      {/* El logo WAIS está centrado absolutamente, así que no afecta el layout de las otras secciones */}
      <div className="flex items-center space-x-4">
        <Avatar size="small" avatarType="user" />
        <button
          onClick={signOut}
          className="
            text-brand-text-primary hover:text-brand-primary-900
            focus:outline-none focus:ring-2 focus:ring-brand-primary-900
          "
          aria-label="Cerrar sesión" // Añadido aria-label para accesibilidad
        >
          <IconLogout size={20} />
        </button>
      </div>
    </nav>
    </>
  );
}