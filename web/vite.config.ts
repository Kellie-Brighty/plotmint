import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import { VitePWA } from "vite-plugin-pwa";

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [
    react(),
    VitePWA({
      registerType: "autoUpdate",
      workbox: {
        globPatterns: ["**/*.{js,css,html,ico,png,svg,woff2}"],
      },
      includeAssets: ["favicon.ico", "plotmint-icon.svg"],
      manifest: {
        name: "PlotMint - Interactive Storytelling Platform",
        short_name: "PlotMint",
        description:
          "Create interactive stories where readers vote on plot directions using tokens",
        theme_color: "#059669",
        background_color: "#ffffff",
        display: "standalone",
        scope: "/",
        start_url: "/",
        icons: [
          {
            src: "plotmint-icon.svg",
            sizes: "any",
            type: "image/svg+xml",
            purpose: "any",
          },
        ],
      },
      // Enable PWA in development
      devOptions: {
        enabled: true,
        type: "module",
      },
    }),
  ],
  server: {
    proxy: {
      "/api/zora": {
        target: "https://api-sdk.zora.engineering",
        changeOrigin: true,
        rewrite: (path) => path.replace(/^\/api\/zora/, ""),
        headers: {
          "Access-Control-Allow-Origin": "*",
        },
      },
    },
  },
});
