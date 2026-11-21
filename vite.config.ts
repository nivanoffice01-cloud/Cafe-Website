import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  server: {
    proxy: {
      '/crm-api': {
        target: 'http://127.0.0.1:4173',
        changeOrigin: true,
        rewrite: (path) => path.replace(/^\/crm-api/, ''),
      },
    },
  },
  build: {
    // The lazy Three.js scene chunk is ~634 kB minified (~160 kB gzip).
    chunkSizeWarningLimit: 700,
  },
})
