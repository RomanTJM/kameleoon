import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import svgr from 'vite-plugin-svgr'

export default defineConfig({
  plugins: [
    react(),
    svgr({
      svgrOptions: {
        icon: true,
      },
    }),
  ],
  base: process.env.NODE_ENV === 'production' ? '/kameleoon/' : '/',
  build: {
    outDir: 'dist'
  }
})

