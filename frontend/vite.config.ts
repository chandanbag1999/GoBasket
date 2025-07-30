import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      '@': '/src',
      '@/components': '/src/components',
      '@/pages': '/src/pages',
      '@/hooks': '/src/hooks',
      '@/services': '/src/services',
      '@/store': '/src/store',
      '@/types': '/src/types',
      '@/utils': '/src/utils',
      '@/constants': '/src/constants',
    },
  },
  server: {
    port: 5173,
    host: true,
  },
})
