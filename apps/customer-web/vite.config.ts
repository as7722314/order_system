import vue from "@vitejs/plugin-vue";
import { defineConfig, loadEnv } from "vite";

const productionApiHost = "line-order-system-api.onrender.com";

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, "../..", "");
  const apiBaseUrl = env.VITE_API_BASE_URL || "/api";
  const apiHost = new URL(apiBaseUrl, "http://local.invalid").hostname;

  if (mode !== "production" && apiHost === productionApiHost) {
    throw new Error("Safety check: development mode cannot use the production API. Use a production build instead.");
  }
  if (mode === "production" && env.VITE_DEV_BYPASS_AUTH === "true") {
    throw new Error("Safety check: production mode cannot bypass customer authentication.");
  }

  return {
    envDir: "../..",
    plugins: [vue()],
    server: {
      port: 5173,
      proxy: {
        "/api": "http://localhost:3000"
      }
    }
  };
});
