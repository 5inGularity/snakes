import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { VitePWA } from 'vite-plugin-pwa'

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [
    react(),
    VitePWA({
      registerType: 'autoUpdate',
      manifest: false, // Use existing public/manifest.json
      workbox: {
        globPatterns: ['**/*.{js,css,html,ico,png,svg,woff,woff2}'],
        runtimeCaching: [
          {
            urlPattern: /^https:\/\/fonts\.googleapis\.com\/.*/i,
            handler: 'CacheFirst',
            options: {
              cacheName: 'google-fonts-cache',
              expiration: {
                maxEntries: 10,
                maxAgeSeconds: 60 * 60 * 24 * 365, // <== 365 days
              },
              cacheableResponse: {
                statuses: [0, 200],
              },
            },
          },
        ],
      },
    }),
  ],
  server: {
    host: '0.0.0.0', // Listen on all network interfaces
    port: 5173,
    strictPort: false,
    allowedHosts: [
      'becoming-surely-catfish.ngrok-free.app',
      '.ngrok-free.app', // Allow all ngrok-free.app subdomains
      '.ngrok.io', // Allow all ngrok.io subdomains (if you use paid tier)
    ],
    hmr: {
      clientPort: 443, // Use HTTPS port for ngrok
    },
  },
  preview: {
    host: '0.0.0.0',
    port: 5173,
  },
})
