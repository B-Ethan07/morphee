import { defineConfig } from "vite";
import vue from "@vitejs/plugin-vue";

export default defineConfig({
  plugins: [vue()],
  server: {
    // En développement, les appels /api sont renvoyés vers Express
    proxy: { "/api": "http://localhost:3000" },
  },
});
