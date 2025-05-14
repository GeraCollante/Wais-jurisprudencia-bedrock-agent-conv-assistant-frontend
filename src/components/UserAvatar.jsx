import PropTypes from "prop-types";
import { IconMessageChatbot, IconUser } from "@tabler/icons-react";
import { useAuthenticator } from "@aws-amplify/ui-react";

UserAvatar.propTypes = {
  userType: PropTypes.oneOf(["user", "bot"]), // Cambiado de avatarType a userType
  size: PropTypes.oneOf([null, "user", "small"]),
};

export default function UserAvatar({ userType, size }) { // Cambiado de avatarType a userType
  const {
    user: { username },
  } = useAuthenticator((context) => [context.user]);

  const sizeVariants = {
    default: "h-10 w-10 leading-10 text-lg",
    small: "h-8 w-8 leading-8 text-sm",
  };

  const sizeClasses = sizeVariants[size] || sizeVariants.default;

  return (
    <div
      className={`${sizeClasses} flex flex-none select-none items-center justify-center rounded-full
        ${
          userType === "bot" // Usando userType
            ? "mr-2 bg-brand-bluegray-soft" // MODIFICADO: Fondo para bot (Color C)
            : "ml-2 bg-brand-gray-light"   // MODIFICADO: Fondo para usuario/default (Color B)
        }`}
    >
      {userType === "user" && ( // Usando userType
        <span className="text-center font-semibold text-brand-black"> {/* MODIFICADO: Color de texto para inicial de usuario (Color F) */}
          {username.charAt(0).toUpperCase()}
        </span>
      )}

      {userType === "bot" && ( // Usando userType
        <IconMessageChatbot className="m-auto stroke-brand-black" /> {/* MODIFICADO: Color del icono de bot (Color F) */}
      )}

      {!userType && ( // Usando userType
        <IconUser size={20} className="m-auto stroke-brand-black" /> {/* MODIFICADO: Color del icono default (Color F) */}
      )}
    </div>
  );
}