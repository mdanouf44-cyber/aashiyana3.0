import react from "@vitejs/plugin-react";
import { defineConfig } from "vite";

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  build: {
    chunkSizeWarningLimit: 700,
    rollupOptions: {
      output: {
        manualChunks(id) {
          if (id.includes("gsap")) return "gsap";
          if (id.includes("lenis")) return "lenis";
          if (id.includes("html2canvas")) return "html2canvas";
        },
      },
    },
  },
});
