import react from '@vitejs/plugin-react'
import { defineConfig } from 'vite'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  server: {
    // Dev only. In production the API serves these files itself,
    // so "/api" is already same-origin and needs no proxy.
    proxy: {
      "/api": {
        target: "http://localhost:5011",
        changeOrigin: true,
      },
    },
  },
  build: {
    // Publish the SPA into the API's wwwroot so one deployment serves both.
    outDir: "../SchoolEquipmentSystem/SchoolEquipmentSystem/wwwroot",
    emptyOutDir: true,
  },
})
