import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  server: { port: 3000 },
  base: '/SPLT-EDITOR/',
  build: {
    outDir: 'dist',
    sourcemap: false,
    target: 'esnext',
    rollupOptions: {
      output: {
        manualChunks: {
          vendor: ['react', 'react-dom'],
          monaco: ['monaco-editor', '@monaco-editor/react']
        }
      }
    },
    // GitHub Pages用の設定
    assetsDir: 'assets',
    chunkSizeWarningLimit: 1000
  },
  optimizeDeps: {
    include: ['@tauri-apps/api/fs']
  },
})
