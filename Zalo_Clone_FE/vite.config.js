import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react-swc'

export default defineConfig({
  plugins: [react()],
  define: {
    global: 'window',
  },
  server: {
    proxy: {
      '/api': {
        target: 'http://localhost:8080',
        changeOrigin: true,
        rewrite: (path) => path.replace(/^\/api/, ''),
        secure: false,
      },
      '/ws': {
        target: 'http://localhost:8080',
        changeOrigin: true,
        ws: true, // Hỗ trợ WebSocket
        secure: false,
      }
    }
  }
})