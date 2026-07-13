import vue from "@vitejs/plugin-vue";
import { defineConfig } from "vite";

export default defineConfig({
  base: "/admin/",
  envDir: "../..",
  plugins: [vue()],
  server: {
    port: 5174,
    proxy: {
      "/api": "http://localhost:3000"
    }
  }
});
