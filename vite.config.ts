import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig(({ command, mode }) => {
  const isProduction = command === 'build' || mode === 'production'
  
  return {
    plugins: [
      react(),
      // 本番環境でのみconsole.logを削除するプラグイン
      isProduction && {
        name: 'remove-console-production',
        transform(code, id) {
          if (id.includes('node_modules')) return code
          
          // console.log系の呼び出しを削除
          return code
            .replace(/console\.log\s*\([^)]*\);?/g, '')
            .replace(/console\.warn\s*\([^)]*\);?/g, '')
            .replace(/console\.error\s*\([^)]*\);?/g, '')
            .replace(/console\.info\s*\([^)]*\);?/g, '')
            .replace(/console\.debug\s*\([^)]*\);?/g, '')
            // 空行を削除
            .replace(/^\s*[\r\n]/gm, '')
        }
      }
    ].filter(Boolean),
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
