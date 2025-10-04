import { useCallback, useEffect, useState } from 'react'
import { logger } from '@/utils/logger'
import ReactDOM from 'react-dom/client'
import App from './App'
import {
	Settings,
	getDefaultSettingForDevice,
	MOBILE_LAYOUT_VALUES,
	DESKTOP_LAYOUT_VALUES,
} from './domain/entities/defaultSetting'
import { loadEditorSettings } from './usecases/editor/LoadEditorSettings'
import { serviceFactory } from './infra'
// manifestのorientation管理
import { setupManifestOrientationListener } from './utils/manifestManager'
import { isTauri, isMobileSize, isPWA, getPWADetails } from './utils'
import { storageServiceFactory } from './application/storage/StorageService'
// Monaco Editorのワーカー設定をside-effects importで実行
import '@/workers/useMonacoWorker'

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
	const [isFullscreenMode, setIsFullscreenMode] = useState(false)

	// 起動時の初期化処理
	useEffect(() => {
		const initializeApp = async () => {
			try {
				logger.info('App', 'Starting app initialization...')
				logger.info('App', 'Initial window size', `${window.innerWidth} x ${window.innerHeight}`)

				// 起動時のウィンドウサイズを元に初期設定を決定
				const initialSettings = getDefaultSettingForDevice()
				logger.info('App', 'Initial settings based on window size', initialSettings)

				// PWA環境の検知
				const pwaDetails = getPWADetails()
				logger.info('App', 'PWA detection results', pwaDetails)

				// 設定を読み込み（失敗した場合は初期設定を使用）
				try {
					if (isTauri()) {
						// Tauri環境では既存の方法を使用
						const fileDataRepository = serviceFactory.getFileDataRepository()
						const loadedSettings = await loadEditorSettings(fileDataRepository)
						logger.info('App', 'Settings loaded successfully from Tauri', loadedSettings)

						// 読み込んだ設定を現在のデバイスサイズに合わせて部分的に調整
						const adjustedSettings = updateSettingsForDevice(loadedSettings)
						logger.info('App', 'Settings adjusted for current device', adjustedSettings)
						setSettings(adjustedSettings)
					} else if (isPWA()) {
						// PWA環境では専用のストレージサービスを使用
						const settingsStorageService = storageServiceFactory.createSettingsStorageService()
						const loadedSettings = await settingsStorageService.loadSettings()

						if (loadedSettings) {
							logger.info('App', 'Settings loaded successfully from PWA storage', loadedSettings)
							const adjustedSettings = updateSettingsForDevice(loadedSettings)
							logger.info('App', 'Settings adjusted for current device', adjustedSettings)
							setSettings(adjustedSettings)
						} else {
							logger.info('App', 'No settings found in PWA storage, using initial settings')
							setSettings(initialSettings)
						}
					} else {
						// ブラウザ環境では既存の方法を使用
						logger.info('App', 'Browser environment detected, using localStorage')
						const fileDataRepository = serviceFactory.getFileDataRepository()
						const loadedSettings = await loadEditorSettings(fileDataRepository)
						logger.info('App', 'Settings loaded successfully from browser storage', loadedSettings)

						// 読み込んだ設定を現在のデバイスサイズに合わせて部分的に調整
						const adjustedSettings = updateSettingsForDevice(loadedSettings)
						logger.info('App', 'Settings adjusted for current device', adjustedSettings)
						setSettings(adjustedSettings)
					}
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

	// モバイル用の設定を部分的に更新する関数
	const updateSettingsForDevice = useCallback((currentSettings: Settings): Settings => {
		const isMobile = isMobileSize()
		const isCurrentlyMobile =
			currentSettings.editor.fontSize === MOBILE_LAYOUT_VALUES.editor.fontSize &&
			currentSettings.editor.wordWrapColumn === MOBILE_LAYOUT_VALUES.editor.wordWrapColumn

		// モバイル状態が変わらない場合は設定を変更しない
		if (isMobile === isCurrentlyMobile) {
			return currentSettings
		}

		if (isMobile) {
			// モバイル用設定に変更（色味は保持）
			return {
				...currentSettings,
				editor: {
					...currentSettings.editor,
					...MOBILE_LAYOUT_VALUES.editor,
				},
				preview: {
					...currentSettings.preview,
					...MOBILE_LAYOUT_VALUES.preview,
				},
			}
		} else {
			// デスクトップ用設定に変更（色味は保持）
			return {
				...currentSettings,
				editor: {
					...currentSettings.editor,
					...DESKTOP_LAYOUT_VALUES.editor,
				},
				preview: {
					...currentSettings.preview,
					...DESKTOP_LAYOUT_VALUES.preview,
				},
			}
		}
	}, [])

	const handleResize = useCallback(() => {
		// フルスクリーン状態の場合は設定を更新しない
		if (isFullscreenMode) {
			logger.debug('App', 'Resize detected in fullscreen mode, skipping settings update')
			return
		}

		// フルスクリーンから抜けた直後のリサイズも無視する
		// フルスクリーン解除から一定時間は設定変更を防ぐ
		const timeSinceLastFullscreen = Date.now() - (window as any).lastFullscreenExitTime || 0
		if (timeSinceLastFullscreen < 1000) {
			logger.debug('App', 'Resize detected shortly after fullscreen exit, skipping settings update')
			return
		}

		setSettings(prevSettings => {
			const updatedSettings = updateSettingsForDevice(prevSettings)

			// 設定が変更された場合のみ更新
			if (JSON.stringify(prevSettings) !== JSON.stringify(updatedSettings)) {
				logger.info('App', 'Resize detected, updating device-specific settings', {
					from: {
						fontSize: prevSettings.editor.fontSize,
						wordWrapColumn: prevSettings.editor.wordWrapColumn,
						charsPerLine: prevSettings.preview.charsPerLine,
					},
					to: {
						fontSize: updatedSettings.editor.fontSize,
						wordWrapColumn: updatedSettings.editor.wordWrapColumn,
						charsPerLine: updatedSettings.preview.charsPerLine,
					},
				})
				return updatedSettings
			} else {
				logger.debug('App', 'Settings unchanged, no update needed')
			}
			return prevSettings
		})
	}, [isFullscreenMode, updateSettingsForDevice])

	// ウィンドウサイズの変更とフルスクリーン状態の変化を監視
	useEffect(() => {
		// 初期化完了後にのみリスナーを設定
		if (!isInitialized) return

		logger.info('App', 'Setting up resize and fullscreen listeners...')

		// リサイズイベントリスナー
		window.addEventListener('resize', handleResize)

		// フルスクリーン状態変化リスナー
		const handleFullscreenChange = () => {
			const isFullscreen =
				!!document.fullscreenElement ||
				!!(document as any).webkitFullscreenElement ||
				!!(document as any).mozFullScreenElement ||
				!!(document as any).msFullscreenElement

			logger.debug('App', 'Fullscreen state changed', { isFullscreen })
			setIsFullscreenMode(isFullscreen)

			// フルスクリーンから抜けた時は設定を保持（再評価しない）
			if (!isFullscreen) {
				logger.debug('App', 'Exited fullscreen mode, keeping current settings')
				// フルスクリーン解除時刻を記録
				;(window as any).lastFullscreenExitTime = Date.now()
			}
		}

		document.addEventListener('fullscreenchange', handleFullscreenChange)
		document.addEventListener('webkitfullscreenchange', handleFullscreenChange)
		document.addEventListener('mozfullscreenchange', handleFullscreenChange)
		document.addEventListener('MSFullscreenChange', handleFullscreenChange)

		return () => {
			window.removeEventListener('resize', handleResize)
			document.removeEventListener('fullscreenchange', handleFullscreenChange)
			document.removeEventListener('webkitfullscreenchange', handleFullscreenChange)
			document.removeEventListener('mozfullscreenchange', handleFullscreenChange)
			document.removeEventListener('MSFullscreenChange', handleFullscreenChange)
		}
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
