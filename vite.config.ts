import { VitePWA } from 'vite-plugin-pwa';
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

// https://vitejs.dev/config/
export default defineConfig({
  server: {
    //remover en BUILD

    allowedHosts: true,

  },
  plugins: [
    react(),
    VitePWA({
      registerType: 'prompt',
      injectRegister: false,

      pwaAssets: {
        disabled: true,
        config: true,
      },

      manifest: {
        name: 'pwa-berllano',
        short_name: 'pwa-berllano',
        description: 'pwa-berllano',
        theme_color: '#f5f5f5',
      },

      workbox: {
        globPatterns: ['*/.{js,css,html,svg,png,ico}'],
        cleanupOutdatedCaches: true,
        clientsClaim: true,
      },

      devOptions: {
        enabled: false,
        navigateFallback: 'index.html',
        suppressWarnings: true,
        type: 'module',
      },
    }),
  ],
});
