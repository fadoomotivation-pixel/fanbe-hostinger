import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import path from 'path'
export default defineConfig({
  base: '/crm/',
  build: { outDir: 'dist/crm' },
  plugins: [react()],
  resolve: { alias: { '@': path.resolve(__dirname, './src') } },
})
