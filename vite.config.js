import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import path from 'path'

const timestamp = Date.now();

export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
  build: {
    // Keep Hostinger/GitHub logs clean: this app intentionally ships a larger main bundle.
    chunkSizeWarningLimit: 3000,
    rollupOptions: {
      output: {
        // Hash ALL assets including CSS so old cache never loads wrong file
        entryFileNames: `assets/[name]-[hash]-${timestamp}.js`,
        chunkFileNames: `assets/[name]-[hash]-${timestamp}.js`,
        assetFileNames: `assets/[name]-[hash]-${timestamp}.[ext]`,
        // Code splitting for faster mobile load
        manualChunks: {
          // Vendor chunk - React core
          'vendor-react': ['react', 'react-dom', 'react-router-dom'],
          // Supabase chunk
          'vendor-supabase': ['@supabase/supabase-js'],
          // UI components chunk
          'vendor-ui': [
            '@radix-ui/react-dialog',
            '@radix-ui/react-select',
            '@radix-ui/react-tabs',
            '@radix-ui/react-toast',
          ],
        },
      }
    }
  }
})
