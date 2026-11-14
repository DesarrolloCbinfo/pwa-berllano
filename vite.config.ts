import { VitePWA } from 'vite-plugin-pwa';
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import type { ProxyOptions } from 'vite';
import type { IncomingMessage, ServerResponse } from 'http';
import type { ClientRequest } from 'http';

// https://vitejs.dev/config/
export default defineConfig({
  server: {
    //remover en BUILD


    allowedHosts: true,
    proxy: {
      '/api': {
        target: 'https://127.0.0.1:7102',
        changeOrigin: true,
        secure: false,
        configure: (proxy, options) => {
          proxy.on('error', (err: Error, req: IncomingMessage, res: ServerResponse) => {
            console.log('proxy error', err);
          });
          proxy.on('proxyReq', (proxyReq: ClientRequest, req: IncomingMessage, res: ServerResponse) => {
            console.log('Sending Request to the Target:', req.method, req.url);
          });
          proxy.on('proxyRes', (proxyRes: IncomingMessage, req: IncomingMessage, res: ServerResponse) => {
            console.log('Received Response from the Target:', proxyRes.statusCode, req.url);
          });
        }
      }
    }

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
        enabled: true,
        navigateFallback: 'index.html',
        suppressWarnings: true,
        type: 'module',
      },
    }),
  ],
});
