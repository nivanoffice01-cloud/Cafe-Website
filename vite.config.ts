import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  build: {
    // The lazy Three.js scene chunk is ~634 kB minified (~160 kB gzip).
    chunkSizeWarningLimit: 700,
  },
})
