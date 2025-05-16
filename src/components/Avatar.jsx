import PropTypes from "prop-types";
import { IconScale, IconUser } from "@tabler/icons-react";
import { useAuthenticator } from "@aws-amplify/ui-react";

Avatar.propTypes = {
  avatarType: PropTypes.oneOf(["user", "bot"]),
  size: PropTypes.oneOf([null, "user", "small"]),
};

export default function Avatar({ avatarType, size }) {
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
          avatarType === "bot"
            ? "mr-2 bg-brand-primary-200" // Fondo para bot
            : "ml-2 bg-brand-secondary-100"   // Fondo para usuario/default
        }`}
    >
      {avatarType === "user" && (
        <span className="text-center font-semibold text-brand-text-primary">
          {username.charAt(0).toUpperCase()}
        </span>
      )}

      {avatarType === "bot" && (
        <IconScale className="m-auto stroke-brand-text-primary" />
      )}

      {!avatarType && (
        <IconUser className="m-auto stroke-brand-text-primary" size={20} />
      )}
    </div>
  );
}