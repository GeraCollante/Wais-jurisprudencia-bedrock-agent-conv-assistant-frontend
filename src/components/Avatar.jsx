import PropTypes from "prop-types";
import { IconMessageChatbot, IconUser } from "@tabler/icons-react";
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
      className={`${sizeClasses} flex flex-none select-none rounded-full
        ${
          avatarType && avatarType === "bot"
            ? "mr-2 bg-pink-600 dark:bg-pink-500"
            : "ml-2 bg-orange-500 text-orange-200 dark:bg-orange-400 dark:text-orange-950"
        }`}
    >
      {avatarType === "user" && (
        <span className="flex-1 text-center font-semibold">
          {username.charAt(0).toUpperCase()}
        </span>
      )}

      {avatarType === "bot" && (
        <IconMessageChatbot className="m-auto stroke-pink-200" />
      )}

      {!avatarType && (
        <IconUser size={20} className="m-auto stroke-orange-200" />
      )}
    </div>
  );
}
