import { defineConfig, loadEnv } from "vite";
import react from "@vitejs/plugin-react";

// https://vitejs.dev/config/
export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), "");
  const proxyTarget = env.VITE_PROXY || "http://localhost:8800";

  return {
    plugins: [react()],
    server: {
      proxy: {
        "/auth": proxyTarget,
        "/api": proxyTarget,
      },
    },
  };
});
