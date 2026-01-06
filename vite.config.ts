import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { visualizer } from 'rollup-plugin-visualizer'

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [
    react(),
    visualizer({
      open: true,
      gzipSize: true,
      brotliSize: true,
      filename: 'dist/stats.html',
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
