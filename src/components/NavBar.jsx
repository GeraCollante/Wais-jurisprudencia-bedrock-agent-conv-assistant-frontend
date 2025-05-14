import { useAuthenticator } from "@aws-amplify/ui-react";
import { IconLogout, IconMessageChatbot } from "@tabler/icons-react";
import Avatar from "./Avatar";

export default function NavBar() {
  const { signOut } = useAuthenticator((context) => [context.user]);

  const env = import.meta.env; // Vite environment variables
  
  // Guardar el valor en una variable
  // const appName = env.VITE_APP_NAME;
  const appName = "IBS Assistant";
  const appLogoUrl = env.VITE_APP_LOGO_URL;

  return (
    <nav className="mb-1 flex justify-between bg-white p-4 shadow-md">
      <div className="hidden items-center lg:flex">
        <h1 className="text-md font-bold leading-8 text-gray-800">
          {appName}
        </h1>
        <IconMessageChatbot className="ml-1" />
      </div>

      <img className="h-8" src={appLogoUrl} />

      <div className="flex">
        <Avatar size="small" avatarType="user" />

        <button
          onClick={signOut}
          className="ml-4 text-sm text-gray-600 hover:text-gray-800"
        >
          <span className="font-bold">
            <IconLogout />
          </span>
        </button>
      </div>
    </nav>
  );
}
