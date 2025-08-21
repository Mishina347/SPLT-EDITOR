import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { VitePWA } from 'vite-plugin-pwa'

export default defineConfig(({ command, mode }) => {
  const isProduction = command === 'build' || mode === 'production'
  
  return {
    plugins: [
      react(),
      VitePWA({
        registerType: 'autoUpdate',
        injectRegister: 'auto',
        workbox: {
            maximumFileSizeToCacheInBytes: 5242880,
        },
        manifest: {
          name: 'SPLT-EDITOR',
          short_name: 'SPLT-EDITOR',
          start_url: '/SPLT-EDITOR/',
          scope: '/SPLT-EDITOR/',
          display: 'standalone',
          background_color: '#000000',
          theme_color: '#FFFFFF',

          icons: [
            {
              src: 'images/icons/icon-192x192.png',
              sizes: '192x192',
              type: 'image/png',
            },
            {
              src: 'images/icons/icon-512x512.png',
              sizes: '512x512',
              type: 'image/png',
            },
          ],
        },
      }),
    ],
    server: { 
      port: 3000,
      base: '/SPLT-EDITOR/'
    },
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
      }
    },
    optimizeDeps: {
      include: ['@tauri-apps/api/fs']
    }
  }
})
