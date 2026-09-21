import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  build: {
    chunkSizeWarningLimit: 750,
    rollupOptions: {
      output: {
        manualChunks(id) {
          if (id.includes('node_modules/@tensorflow-models/blazeface')) return 'blazeface'
          if (id.includes('node_modules/@tensorflow')) return 'tensorflow'
          if (id.includes('node_modules/@mediapipe')) return 'mediapipe'
          return undefined
        },
      },
    },
  },
  server: {
    port: 5174,
    strictPort: true,
    host: 'localhost',
  },
})
