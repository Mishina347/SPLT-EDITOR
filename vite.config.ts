import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig(({ command, mode }) => {
  const isProduction = command === 'build' || mode === 'production'
  
  return {
    plugins: [
      react(),
    ],
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
      chunkSizeWarningLimit: 1000,
      // ESBuildの設定でconsole.logを削除
      minify: 'esbuild',
      esbuild: {
        drop: isProduction ? ['console', 'debugger'] : [],
        pure: isProduction ? ['console.log', 'console.warn', 'console.info', 'console.debug'] : []
      }
    },
    optimizeDeps: {
      include: ['@tauri-apps/api/fs']
    }
  }
})
