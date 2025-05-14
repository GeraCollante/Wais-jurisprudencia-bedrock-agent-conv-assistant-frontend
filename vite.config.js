import { defineConfig } from "vite";
import react from "@vitejs/plugin-react-swc";

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: [
      { find: "@routes", replacement: "/src/routes" },
      { find: "@components", replacement: "/src/components" },
    ],
  },
  define: {
    // The following is needed for Amplify.
    //`global` is a node builtin that vite doesn't add polyfills for.
    // https://github.com/vitejs/vite/discussions/5912?sort=top#discussioncomment-1724947
    global: "globalThis",
  },
  build: {
    rollupOptions: {
      external: ['aws-amplify/auth']
    }
  }
});
