import tailwindcss from '@tailwindcss/vite'
import react from '@vitejs/plugin-react'
import { defineConfig } from 'vite'
import { fileURLToPath, URL } from 'node:url'

// ตอน dev ให้ Vite ส่ง request ที่ขึ้นต้นด้วย /api และ /healthz ต่อไปที่ Go
// เบราว์เซอร์จะเห็นทุกอย่างเป็น origin เดียวกัน จึงไม่ติด CORS
// ใน Docker ตั้ง API_PROXY_TARGET=http://api:8080
const apiTarget = process.env.API_PROXY_TARGET ?? 'http://localhost:8080'

export default defineConfig({
  plugins: [react(), tailwindcss()],
  resolve: {
    alias: { '@': fileURLToPath(new URL('./src', import.meta.url)) },
  },
  server: {
    proxy: {
      '/api': apiTarget,
      '/healthz': apiTarget,
    },
  },
})