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
            ? "mr-2 bg-brand-primary-200" // Fondo para bot
            : "ml-2 bg-brand-secondary-100"   // Fondo para usuario/default
        }`}
    >
      {userType === "user" && ( // Usando userType
        <span className="text-center font-semibold text-brand-text-primary">
          {username.charAt(0).toUpperCase()}
        </span>
      )}

      {userType === "bot" && ( // Usando userType
        <IconMessageChatbot className="m-auto stroke-brand-text-primary" />
      )}

      {!userType && ( // Usando userType
        <IconUser size={20} className="m-auto stroke-brand-text-primary" />
      )}
    </div>
  );
}