import { useEffect, useState } from 'react'
import ReactDOM from 'react-dom/client'
import App from './App'
import { DEFAULT_SETTING, Settings } from './domain/entities/defaultSetting'
import { loadSettings } from './usecases/settingsUseCase'

// PWA関連のインポート（Tauri環境では無効化）
let registerSW: any = null
let RegisterSWOptions: any = null

// Tauri環境でない場合のみPWA関連をインポート
if (typeof window !== 'undefined' && !isTauri()) {
	try {
		registerSW = require('virtual:pwa-register').registerSW
		RegisterSWOptions = require('vite-plugin-pwa/client').RegisterSWOptions
		require('./utils/swDebug')
	} catch (error) {
		console.log('[App] PWA imports skipped:', error)
	}
}
// Monaco Editorのワーカー設定をside-effects importで実行
import '@/useMonacoWorker'
// manifestのorientation管理
import { setupManifestOrientationListener } from './utils/manifestManager'
import { isTauri, isTauriBuild } from './utils'

// Service Workerの動作確認用デバッグ（Tauri環境では無効化）
function debugServiceWorker() {
	// Tauri環境ではService Workerを無効化
	if (isTauri()) {
		console.log('[SW Debug] Service Worker disabled in Tauri environment')
		return
	}

	if ('serviceWorker' in navigator) {
		console.log('[SW Debug] Service Worker API is available')

		navigator.serviceWorker.getRegistrations().then(registrations => {
			console.log('[SW Debug] Current registrations:', registrations.length)
			registrations.forEach((registration, index) => {
				console.log(`[SW Debug] Registration ${index}:`, {
					scope: registration.scope,
					active: !!registration.active,
					installing: !!registration.installing,
					waiting: !!registration.waiting,
				})
			})
		})

		navigator.serviceWorker.addEventListener('message', event => {
			console.log('[SW Debug] Message from SW:', event.data)
		})

		navigator.serviceWorker.addEventListener('error', event => {
			console.error('[SW Debug] SW Error:', (event as any).error)
		})
	} else {
		console.log('[SW Debug] Service Worker API is not available')
	}
}

function Root() {
	const [settings, setSettings] = useState<Settings>(DEFAULT_SETTING)
	const [isLoading, setIsLoading] = useState(true)
	const [error, setError] = useState<string | null>(null)

	useEffect(() => {
		// 確実なログ出力
		console.log('=== APP STARTUP LOGS ===')
		console.log('[App] Starting application...')
		console.log('[App] Environment:', import.meta.env.MODE)
		console.log('[App] Tauri platform:', import.meta.env.VITE_TAURI_PLATFORM || 'undefined')
		console.log('[App] User agent:', navigator.userAgent)
		console.log('[App] Platform:', navigator.platform)
		console.log('[App] Language:', navigator.language)
		console.log('[App] Root element exists:', !!document.getElementById('root'))

		// localStorageにも保存
		try {
			const logs = [
				`[${new Date().toISOString()}] App Starting...`,
				`[${new Date().toISOString()}] Environment: ${import.meta.env.MODE}`,
				`[${new Date().toISOString()}] Tauri platform: ${import.meta.env.VITE_TAURI_PLATFORM || 'undefined'}`,
				`[${new Date().toISOString()}] User agent: ${navigator.userAgent}`,
				`[${new Date().toISOString()}] Platform: ${navigator.platform}`,
				`[${new Date().toISOString()}] Root element exists: ${!!document.getElementById('root')}`,
			]
			localStorage.setItem('app_startup_logs', JSON.stringify(logs))
			console.log('[App] Logs saved to localStorage')
		} catch (error) {
			console.error('[App] Failed to save logs to localStorage:', error)
		}

		loadSettings()
			.then(loadedSettings => {
				console.log('[App] Settings loaded successfully:', loadedSettings)
				setSettings(loadedSettings)
				setIsLoading(false)
			})
			.catch(error => {
				console.error('[App] Failed to load settings:', error)
				setError(error.toString())
				setIsLoading(false)
			})

		// manifestのorientation管理を初期化
		try {
			const cleanup = setupManifestOrientationListener()
			console.log('[App] Manifest orientation listener setup completed')
			// クリーンアップ関数を返す（undefinedの場合は何もしない）
			return cleanup || (() => {})
		} catch (error) {
			console.error('[App] Failed to setup manifest orientation listener:', error)
			return () => {}
		}
	}, [])

	if (isLoading) {
		console.log('[App] Rendering loading state...')
		return (
			<div style={{ margin: 'auto', padding: '20px', textAlign: 'center' }}>
				<div>Loading settings...</div>
				<button
					onClick={() => {
						const logs = localStorage.getItem('app_startup_logs')
						if (logs) {
							alert('Startup Logs:\n' + logs)
						} else {
							alert('No startup logs found')
						}
					}}
					style={{ marginTop: '10px', padding: '5px 10px' }}
				>
					Show Startup Logs
				</button>
			</div>
		)
	}

	if (error) {
		console.log('[App] Rendering error state...')
		return (
			<div style={{ margin: 'auto', padding: '20px', textAlign: 'center', color: 'red' }}>
				<div>Error: {error}</div>
				<button
					onClick={() => {
						const logs = localStorage.getItem('app_startup_logs')
						if (logs) {
							alert('Startup Logs:\n' + logs)
						} else {
							alert('No startup logs found')
						}
					}}
					style={{ marginTop: '10px', padding: '5px 10px' }}
				>
					Show Startup Logs
				</button>
			</div>
		)
	}

	console.log('[App] Rendering main app with settings:', settings)

	// Appコンポーネントの存在確認
	if (typeof App === 'undefined') {
		console.error('[App] App component is undefined!')
		return (
			<div style={{ margin: 'auto', padding: '20px', color: 'red' }}>App component not found</div>
		)
	}

	console.log('[App] App component found, rendering...')
	return <App initSettings={settings} />
}

// Service Workerの登録とデバッグ（Tauri環境では無効化）
if (!isTauri()) {
	try {
		const swRegistration = registerSW({
			immediate: true,
			onNeedRefresh() {
				console.log('[SW] Update available')
			},
			onOfflineReady() {
				console.log('[SW] App ready to work offline')
			},
			onRegistered(registration: any) {
				console.log('[SW] Service Worker registered:', registration)
				debugServiceWorker()
			},
			onRegisterError(error: any) {
				console.error('[SW] Registration error:', error)
			},
		})

		swRegistration()
	} catch (error) {
		console.log('[App] Service Worker registration skipped:', error)
	}
} else {
	console.log('[App] Service Worker registration disabled in Tauri environment')
}

ReactDOM.createRoot(document.getElementById('root')!).render(<Root />)
