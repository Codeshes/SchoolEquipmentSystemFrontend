import react from '@vitejs/plugin-react'
import { defineConfig } from 'vite'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  server: {
    // Dev only: forwards /api to the local backend so the browser sees
    // a single origin. In production VITE_API_URL points at MonsterASP.
    proxy: {
      "/api": {
        target: "http://localhost:5011",
        changeOrigin: true,
      },
    },
  },
})
