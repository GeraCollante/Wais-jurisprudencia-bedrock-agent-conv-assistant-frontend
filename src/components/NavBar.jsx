import { IconLogout, IconMenu2 } from "@tabler/icons-react";
import { useCallback } from "react";
import PropTypes from "prop-types";
import { Auth } from "aws-amplify";
import Avatar from "./Avatar";
import { clearAllAuthData } from "../services/authService";
import { navbar as theme } from '../theme';

// Opcional: Importa las imágenes si no están en `public` y tu bundler lo soporta
import logoMinisterio from "../assets/logo-horizontal.svg";
import logoFAM from "../assets/fam.png";
import logoWais from "../assets/wais_jurisprudencia.png";

NavBar.propTypes = {
  onMenuToggle: PropTypes.func,
  isMobileMenuOpen: PropTypes.bool,
};

export default function NavBar({ onMenuToggle, isMobileMenuOpen }) {
  const handleLogout = useCallback(async () => {
    try {
      await Auth.signOut();
    } catch (err) {
      console.error('[NavBar] Sign out error:', err);
    }

    clearAllAuthData();
    window.location.href = '/';
  }, []);
  // const env = import.meta.env; // Ya no se usan directamente estas variables de entorno para los logos aquí
  // const appName = env.VITE_APP_NAME || "IBS Assistant";
  // const appLogoUrl = env.VITE_APP_LOGO_URL;

  return (
    <>
    <nav className={`relative ${theme.bg} ${theme.text} py-4 shadow-md mb-1`}>
      <div className="max-w-4xl md:max-w-6xl lg:max-w-7xl xl:max-w-full mx-auto w-full px-4 md:px-6 lg:px-8">
        
        {/* === VISTA DE ESCRITORIO (lg en adelante) === */}
        <div className="hidden lg:grid lg:grid-cols-3 items-center w-full">
          {/* Columna Izquierda: (logos institucionales ocultos por ahora) */}
          <div className="flex items-center space-x-4 justify-start">
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
              className={`${theme.logoutButton} focus:outline-none focus:ring-2 focus:ring-brand-primary-900`}
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
              className={`p-2 ${theme.menuButton} rounded-lg transition-colors`}
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
              className={theme.logoutButton}
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