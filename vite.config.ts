import react from '@vitejs/plugin-react'
import { defineConfig } from 'vite'

export default defineConfig({
  base: './',
  plugins: [react()],
  // INLINE=1 встраивает фото в сборку, чтобы демо открывалось одним файлом; на сайте фото грузятся отдельно
  build: { assetsInlineLimit: process.env.INLINE ? 400_000 : 4096 },
})
