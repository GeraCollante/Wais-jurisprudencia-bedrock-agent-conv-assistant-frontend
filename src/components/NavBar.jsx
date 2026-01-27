import { useAuthenticator } from "@aws-amplify/ui-react";
import { IconLogout, IconMenu2 } from "@tabler/icons-react";
import { useCallback } from "react";
import PropTypes from "prop-types";
import Avatar from "./Avatar";
import { clearSessionData } from "../services/authService";

// Opcional: Importa las imágenes si no están en `public` y tu bundler lo soporta
import logoMinisterio from "../assets/logo-horizontal.svg";
import logoFAM from "../assets/fam.png";
import logoWais from "../assets/wais_jurisprudencia.png";

NavBar.propTypes = {
  onMenuToggle: PropTypes.func,
  isMobileMenuOpen: PropTypes.bool,
};

export default function NavBar({ onMenuToggle, isMobileMenuOpen }) {
  const { signOut } = useAuthenticator((ctx) => [ctx.user]);

  /**
   * Handle logout with complete cleanup
   */
  const handleLogout = useCallback(async () => {
    console.log('[NavBar] Logging out with cleanup...');

    // Clear all session-related data from storage
    clearSessionData();

    // Clear any in-memory state by reloading after signout
    // This ensures no sensitive data remains in React state
    try {
      await signOut();
    } catch (err) {
      console.error('[NavBar] Sign out error:', err);
    }

    // Force page reload to clear all React state
    // This is the safest way to ensure no data leaks between sessions
    window.location.href = '/';
  }, [signOut]);
  // const env = import.meta.env; // Ya no se usan directamente estas variables de entorno para los logos aquí
  // const appName = env.VITE_APP_NAME || "IBS Assistant";
  // const appLogoUrl = env.VITE_APP_LOGO_URL;

  return (
    <>
    <nav className="relative bg-brand-bg-surface text-brand-text-primary py-4 shadow-md mb-1">
      <div className="max-w-4xl md:max-w-6xl lg:max-w-7xl xl:max-w-full mx-auto w-full px-4 md:px-6 lg:px-8">
        
        {/* === VISTA DE ESCRITORIO (lg en adelante) === */}
        <div className="hidden lg:grid lg:grid-cols-3 items-center w-full">
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
              onClick={handleLogout}
              className="text-brand-text-primary hover:text-brand-primary-900 focus:outline-none focus:ring-2 focus:ring-brand-primary-900"
              aria-label="Cerrar sesion"
            >
              <IconLogout size={20} />
            </button>
          </div>
        </div>

        {/* === VISTA MOVIL (hasta lg) === */}
        <div className="lg:hidden grid grid-cols-3 items-center w-full">
          {/* Izquierda: Botón hamburguesa */}
          <div className="flex items-center justify-start">
            <button
              onClick={onMenuToggle}
              className="p-2 text-brand-primary-900 hover:bg-brand-primary-100 rounded-lg transition-colors"
              aria-label="Toggle menu"
            >
              <IconMenu2 size={24} />
            </button>
          </div>

          {/* Centro: Logo */}
          <div className="flex items-center justify-center">
            <img src={logoWais} alt="Logo WAIS" className="h-8" />
          </div>

          {/* Derecha: Controles de Usuario */}
          <div className="flex items-center space-x-3 justify-end">
            <Avatar size="small" avatarType="user" />
            <button
              onClick={handleLogout}
              className="text-brand-text-primary hover:text-brand-primary-900"
              aria-label="Cerrar sesion"
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