import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  server: {
    // Локально API поднимается отдельным процессом: php -S 8080 -t .
    proxy: {
      '/english/api': {
        target: 'http://localhost:8080',
        changeOrigin: true,
        rewrite: (path) => path.replace(/^\/english\/api/, '/api'),
      },
    },
  },
  base: '/english/',
  css: {
    modules: {
      // .start-screen -> styles.startScreen
      localsConvention: 'camelCase',
    },
  },
})
