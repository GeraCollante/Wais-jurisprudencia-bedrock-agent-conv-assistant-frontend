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
    <nav className="relative bg-brand-bg-surface text-brand-text-primary py-4 shadow-md mb-1">
      <div className="max-w-4xl md:max-w-6xl lg:max-w-7xl xl:max-w-full mx-auto w-full px-4 md:px-6 lg:px-8">
        
        {/* === VISTA DE ESCRITORIO (md en adelante) === */}
        <div className="hidden md:grid md:grid-cols-3 items-center w-full">
          {/* Columna Izquierda: Logos Institucionales */}
          <div className="flex items-center space-x-4 justify-start">
            <img src={logoMinisterio} alt="Logo Ministerio de Justicia" className="h-16" />
            <img src={logoFAM} alt="Logo FAM" className="h-20" />
          </div>

          {/* Columna Central: Logo WAIS - Perfectamente centrado */}
          <div className="flex flex-col items-center justify-center">
            <img src={logoWais} alt="Logo WAIS" className="h-10" />
            <span style={{ fontFamily: 'Arial, sans-serif' }} className="mt-1 text-xs text-brand-text-muted font-sans">
              Realizado por Wais
            </span>
          </div>

          {/* Columna Derecha: Avatar y Logout */}
          <div className="flex items-center space-x-4 justify-end">
            <Avatar size="small" avatarType="user" />
            <button
              onClick={signOut}
              className="text-brand-text-primary hover:text-brand-primary-900 focus:outline-none focus:ring-2 focus:ring-brand-primary-900"
              aria-label="Cerrar sesión"
            >
              <IconLogout size={20} />
            </button>
          </div>
        </div>

        {/* === VISTA MÓVIL (hasta md) === */}
        <div className="md:hidden flex items-center justify-between w-full">
          {/* Logo Principal */}
          <img src={logoWais} alt="Logo WAIS" className="h-8" />

          {/* Controles de Usuario */}
          <div className="flex items-center space-x-3">
            <Avatar size="small" avatarType="user" />
            <button
              onClick={signOut}
              className="text-brand-text-primary hover:text-brand-primary-900"
              aria-label="Cerrar sesión"
            >
              <IconLogout size={20} />
            </button>
          </div>
        </div>
        
      </div>
    </nav>
    </>
  );
}