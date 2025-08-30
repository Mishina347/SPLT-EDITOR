import { useCallback, useEffect, useState } from 'react'
import { logger } from '@/utils/logger'
import ReactDOM from 'react-dom/client'
import App from './App'
import { Settings, getDefaultSettingForDevice } from './domain/entities/defaultSetting'
import { loadSettings } from './usecases/settingsUseCase'
// manifestのorientation管理
import { setupManifestOrientationListener } from './utils/manifestManager'
import { isTauri } from './utils'
// Monaco Editorのワーカー設定をside-effects importで実行
import '@/useMonacoWorker'

// PWA関連のインポート（Tauri環境では無効化）
let registerSW: any = null
// RegisterSWOptionsの型定義
interface RegisterSWOptions {
	immediate?: boolean
	onNeedRefresh?: () => void
	onOfflineReady?: () => void
	onRegistered?: (registration: ServiceWorkerRegistration | undefined) => void
	onRegisterError?: (error: any) => void
}
let RegisterSWOptions: RegisterSWOptions | null = null

// Tauri環境でない場合のみPWA関連をインポート
if (!isTauri()) {
	try {
		registerSW = require('virtual:pwa-register').registerSW
		// vite-plugin-pwa/clientのrequireを削除（ESモジュール環境では動作しない）
		require('./utils/swDebug')
	} catch (error) {
		logger.warn('App', 'PWA imports skipped', error)
	}
}

// Service Workerの動作確認用デバッグ（Tauri環境では無効化）
function debugServiceWorker() {
	// Tauri環境ではService Workerを無効化
	if (isTauri()) {
		logger.info('SW Debug', 'Service Worker disabled in Tauri environment')
		return
	}

	if ('serviceWorker' in navigator) {
		logger.info('SW Debug', 'Service Worker API is available')

		navigator.serviceWorker.getRegistrations().then(registrations => {
			logger.info('SW Debug', 'Current registrations', registrations.length)
			registrations.forEach((registration, index) => {
				logger.debug('SW Debug', `Registration ${index}`, {
					scope: registration.scope,
					active: !!registration.active,
					installing: !!registration.installing,
					waiting: !!registration.waiting,
				})
			})
		})

		navigator.serviceWorker.addEventListener('message', event => {
			logger.debug('SW Debug', 'Message from SW', event.data)
		})

		navigator.serviceWorker.addEventListener('error', event => {
			logger.error('SW Debug', 'SW Error', (event as any).error)
		})
	} else {
		logger.info('SW Debug', 'Service Worker API is not available')
	}
}

function Root() {
	const [settings, setSettings] = useState<Settings>(getDefaultSettingForDevice())
	const [isLoading, setIsLoading] = useState(true)
	const [error, setError] = useState<string | null>(null)
	const [isInitialized, setIsInitialized] = useState(false)

	// 起動時の初期化処理
	useEffect(() => {
		const initializeApp = async () => {
			try {
				logger.info('App', 'Starting app initialization...')
				logger.info('App', 'Initial window size', `${window.innerWidth} x ${window.innerHeight}`)

				// 起動時のウィンドウサイズを元に初期設定を決定
				const initialSettings = getDefaultSettingForDevice()
				logger.info('App', 'Initial settings based on window size', initialSettings)

				// 設定を読み込み（失敗した場合は初期設定を使用）
				try {
					const loadedSettings = await loadSettings()
					logger.info('App', 'Settings loaded successfully', loadedSettings)

					// 読み込んだ設定と初期設定を比較して、必要に応じて更新
					const finalSettings = shouldUpdateSettings(loadedSettings, initialSettings)
						? initialSettings
						: loadedSettings

					logger.info('App', 'Final settings to use', finalSettings)
					setSettings(finalSettings)
				} catch (error) {
					logger.error('App', 'Failed to load settings, using initial settings', error)
					setSettings(initialSettings)
				}

				// manifestのorientation管理を初期化
				try {
					const cleanup = setupManifestOrientationListener()
					logger.info('App', 'Manifest orientation listener setup completed')
					// クリーンアップ関数を返す（undefinedの場合は何もしない）
					return cleanup || (() => {})
				} catch (error) {
					logger.error('App', 'Failed to setup manifest orientation listener', error)
					return () => {}
				}
			} catch (error) {
				logger.error('App', 'Initialization failed', error)
				setError((error as any).toString())
			} finally {
				setIsLoading(false)
				setIsInitialized(true)
				logger.info('App', 'App initialization completed')
			}
		}

		initializeApp()
	}, [])

	// 設定の更新が必要かどうかを判定する関数
	const shouldUpdateSettings = useCallback(
		(currentSettings: Settings, newSettings: Settings): boolean => {
			// 現在のウィンドウサイズと新しい設定のデバイスタイプが一致しない場合は更新
			const currentIsMobile = window.innerWidth <= 768 || window.innerHeight <= 768
			const newIsMobile =
				newSettings.editor.fontSize === 12 && newSettings.editor.wordWrapColumn === 30

			logger.debug('App', 'Settings comparison', {
				currentIsMobile,
				newIsMobile,
				currentFontSize: currentSettings.editor.fontSize,
				newFontSize: newSettings.editor.fontSize,
				windowSize: `${window.innerWidth}x${window.innerHeight}`,
			})

			return currentIsMobile !== newIsMobile
		},
		[]
	)

	const handleResize = useCallback(() => {
		const newSettings = getDefaultSettingForDevice()

		setSettings(prevSettings => {
			// 設定が変更された場合のみ更新
			if (JSON.stringify(prevSettings) !== JSON.stringify(newSettings)) {
				logger.info('App', 'Resize detected, updating settings', {
					from: prevSettings,
					to: newSettings,
				})
				return newSettings
			} else {
				logger.debug('App', 'Settings unchanged, no update needed')
			}
			return prevSettings
		})
	}, [])

	// ウィンドウサイズの変更を監視して設定を動的に更新
	useEffect(() => {
		// 初期化完了後にのみリサイズリスナーを設定
		if (!isInitialized) return

		logger.info('App', 'Setting up resize listener...')
		window.addEventListener('resize', handleResize)
		return () => window.removeEventListener('resize', handleResize)
	}, [isInitialized, handleResize])

	if (isLoading) {
		logger.info('App', 'Rendering loading state...')
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
		logger.info('App', 'Rendering error state...')
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
	// Appコンポーネントの存在確認
	if (typeof App === 'undefined') {
		logger.error('App', 'App component is undefined!')
		return (
			<div style={{ margin: 'auto', padding: '20px', color: 'red' }}>App component not found</div>
		)
	}

	return <App initSettings={settings} />
}

// Service Workerの登録とデバッグ（Tauri環境では無効化）
if (!isTauri()) {
	try {
		const swRegistration = registerSW({
			immediate: true,
			onNeedRefresh() {
				logger.info('SW', 'Update available')
			},
			onOfflineReady() {
				logger.info('SW', 'App ready to work offline')
			},
			onRegistered(registration: any) {
				logger.info('SW', 'Service Worker registered', registration)
				debugServiceWorker()
			},
			onRegisterError(error: any) {
				logger.error('SW', 'Registration error', error)
			},
		})

		swRegistration()
	} catch (error) {
		logger.warn('App', 'Service Worker registration skipped', error)
	}
} else {
	logger.info('App', 'Service Worker registration disabled in Tauri environment')
}

ReactDOM.createRoot(document.getElementById('root')!).render(<Root />)
