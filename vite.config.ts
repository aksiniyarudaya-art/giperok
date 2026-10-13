import react from '@vitejs/plugin-react'
import { defineConfig } from 'vite'

export default defineConfig({
  base: './',
  plugins: [react()],
  // фото техники встраиваются в сборку, чтобы демо открывалось одним файлом
  build: { assetsInlineLimit: 400_000 },
})
