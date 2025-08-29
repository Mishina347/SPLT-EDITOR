import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { VitePWA } from 'vite-plugin-pwa'
import path from 'path'

// Tauriビルドの判定関数を直接定義
function isTauriBuild(): boolean {
	// より確実なTauri環境の判定
	const isTauriEnv =
		process.env.npm_lifecycle_event === 'tauri:build' ||
		process.env.npm_lifecycle_event === 'tauri:dev' ||
		// スクリプト名の詳細判定
		process.env.npm_lifecycle_script?.includes('tauri build') ||
		process.env.npm_lifecycle_script?.includes('tauri:build') ||
		// プロセスパスによる判定
		process.env.npm_execpath?.includes('tauri') ||
		process.env.npm_execpath?.includes('Tauri') ||
		// ユーザーエージェントによる判定
		process.env.npm_config_user_agent?.includes('tauri') ||
		process.env.npm_config_user_agent?.includes('Tauri') ||
		// 現在のディレクトリによる判定
		process.cwd().includes('tauri') ||
		// コマンドライン引数による判定（フォールバック）
		process.argv.some(arg => arg.includes('tauri')) ||
		process.argv.some(arg => arg.includes('Tauri')) ||
		// プロセスの親プロセス情報による判定
		process.env.npm_lifecycle_event === 'build' && 
		(process.env.npm_lifecycle_script?.includes('tauri') || 
		 process.env.npm_lifecycle_script?.includes('tauri build'))

	console.log('=== TAURI BUILD DETECTION DEBUG ===')
	console.log('TAURI_PLATFORM:', process.env.TAURI_PLATFORM)
	console.log('VITE_TAURI_PLATFORM:', process.env.VITE_TAURI_PLATFORM)
	console.log('npm_lifecycle_event:', process.env.npm_lifecycle_event)
	console.log('npm_lifecycle_script:', process.env.npm_lifecycle_script)
	console.log('npm_execpath:', process.env.npm_execpath)
	console.log('npm_config_user_agent:', process.env.npm_config_user_agent)
	console.log('argv:', process.argv)
	console.log('argv length:', process.argv.length)
	console.log('argv[0]:', process.argv[0])
	console.log('argv[1]:', process.argv[1])
	console.log('argv[2]:', process.argv[2])
	console.log('cwd:', process.cwd())
	console.log('isTauriEnv:', isTauriEnv)
	console.log('====================================')

	return isTauriEnv ?? false
}

export default defineConfig(({ command, mode }) => {
  const isProduction = command === 'build' || mode === 'production'
  // Tauriビルドの判定をより確実に
  const isTauriBuildResult = isTauriBuild()
  console.log('isTauriBuildResult:', isTauriBuildResult)
  
  console.log('=== VITE CONFIG DEBUG ===')
  console.log('Vite config - command:', command, 'mode:', mode)
  console.log('Vite config - isTauriBuild:', isTauriBuildResult)
  console.log('Vite config - TAURI_PLATFORM:', process.env.TAURI_PLATFORM)
  console.log('Vite config - npm_lifecycle_event:', process.env.npm_lifecycle_event)
  console.log('Vite config - argv:', process.argv)
  console.log('Vite config - cwd:', process.cwd())
  console.log('Vite config - base path:', isTauriBuildResult ? "/" : (isProduction ? "/SPLT-EDITOR/" : "/"))
  console.log('========================')
  return {
    base: isTauriBuildResult ? "/" : (isProduction ? "/SPLT-EDITOR/" : "/"),
    plugins: [
      react(),
      // Tauri環境ではPWAを無効化
      ...(isTauriBuildResult ? [] : [VitePWA({
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
          // デフォルトはlandscape（デスクトップ用）
          orientation: "landscape",
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
            // iPad用のアイコンサイズ（既存の152x152を使用）
            {
              src: 'images/icons/icon-152x152.png',
              sizes: '152x152',
              type: 'image/png',
            },
          ],
        },
      })]),
    ],
    resolve: {
      alias: {
        '@': path.resolve(__dirname, './src')
      }
    },
    server: { 
      port: 3000,
      base: isTauriBuildResult ? '/' : '/SPLT-EDITOR/'
    },
    build: {
      outDir: 'dist',
      sourcemap: false,
      target: 'esnext',
      // Tauri環境ではchunk分割を無効化（パフォーマンス向上）
      rollupOptions: isTauriBuildResult ? {} : {
        output: {
          manualChunks: {
            vendor: ['react', 'react-dom'],
            monaco: ['monaco-editor', '@monaco-editor/react']
          }
        }
      }
    },
    optimizeDeps: {
      include: ['@tauri-apps/api', '@tauri-apps/plugin-fs']
    }
  }
})
