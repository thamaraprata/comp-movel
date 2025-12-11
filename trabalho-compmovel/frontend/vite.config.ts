import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import { VitePWA } from 'vite-plugin-pwa';

export default defineConfig({
  plugins: [
    react(),
    VitePWA({
      registerType: 'autoUpdate',
      injectRegister: 'auto',
      strategies: 'injectManifest',
      srcDir: 'src',
      filename: 'serviceWorker.ts',
      manifest: false, // Usar o manifest.json existente
      devOptions: {
        enabled: true,
        type: 'module'
      }
    })
  ],
  server: {
    host: "0.0.0.0",
    port: 5173,
    proxy: {
      "/api": {
        target: process.env.VITE_API_PROXY ?? "http://localhost:3334",
        changeOrigin: true
      },
      "/ws": {
        target: process.env.VITE_WS_PROXY ?? "http://localhost:3334",
        ws: true
      }
    }
  },
  build: {
    sourcemap: true
  }
});

