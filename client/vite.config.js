import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  server: {
    port: 5173,
    proxy: {
      '/api': {
        target: 'http://localhost:3001',
        changeOrigin: true
      }
    }
  },
  build: {
    // Enable minification for production
    minify: 'esbuild',
    // Target modern browsers for smaller bundle
    target: 'es2020',
    // Chunk splitting strategy
    rollupOptions: {
      output: {
        manualChunks: {
          // Separate vendor chunk for React
          'vendor-react': ['react', 'react-dom', 'react-router-dom'],
        },
        // Optimize chunk file names
        chunkFileNames: 'assets/[name]-[hash].js',
        entryFileNames: 'assets/[name]-[hash].js',
        assetFileNames: 'assets/[name]-[hash].[ext]'
      }
    },
    // Enable source maps for debugging (can be disabled for production)
    sourcemap: false,
    // Increase chunk size warning limit
    chunkSizeWarningLimit: 500
  },
  // Optimize dependencies
  optimizeDeps: {
    include: ['react', 'react-dom', 'react-router-dom']
  }
})
