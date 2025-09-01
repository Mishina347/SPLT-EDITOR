import { useState, useEffect, useCallback } from 'react'

interface PWAInstallPromptEvent extends Event {
	readonly platforms: string[]
	readonly userChoice: Promise<{
		outcome: 'accepted' | 'dismissed'
		platform: string
	}>
	prompt(): Promise<void>
}

interface PWAState {
	isInstallable: boolean
	isInstalled: boolean
	isOffline: boolean
	isUpdateAvailable: boolean
	updateVersion: string | null
}

interface PWAInstallOptions {
	title?: string
	description?: string
	icon?: string
}

export const usePWA = () => {
	const [pwaState, setPwaState] = useState<PWAState>({
		isInstallable: false,
		isInstalled: false,
		isOffline: false,
		isUpdateAvailable: false,
		updateVersion: null,
	})

	const [deferredPrompt, setDeferredPrompt] = useState<PWAInstallPromptEvent | null>(null)

	// PWAのインストール可能性をチェック
	useEffect(() => {
		const checkInstallability = () => {
			// インストール済みかチェック
			const isInstalled =
				window.matchMedia('(display-mode: standalone)').matches ||
				(window.navigator as any).standalone === true

			// インストール可能かチェック
			const isInstallable = !isInstalled && 'serviceWorker' in navigator

			console.log('[PWA] Installability check:', {
				isInstalled,
				isInstallable,
				hasServiceWorker: 'serviceWorker' in navigator,
				displayMode: window.matchMedia('(display-mode: standalone)').matches,
				navigatorStandalone: (window.navigator as any).standalone,
			})

			setPwaState(prev => ({
				...prev,
				isInstallable,
				isInstalled,
			}))
		}

		checkInstallability()

		// インストールプロンプトイベントのリスナー
		const handleBeforeInstallPrompt = (e: Event) => {
			e.preventDefault()
			const promptEvent = e as PWAInstallPromptEvent
			setDeferredPrompt(promptEvent)
			// グローバルにも設定（HamburgerMenu.tsxで使用）
			;(window as any).deferredPrompt = promptEvent
			setPwaState(prev => ({ ...prev, isInstallable: true }))
			console.log('[PWA] beforeinstallprompt event captured, deferredPrompt set')
		}

		// インストール完了イベントのリスナー
		const handleAppInstalled = () => {
			setPwaState(prev => ({ ...prev, isInstalled: true, isInstallable: false }))
			setDeferredPrompt(null)
			// グローバルからも削除
			;(window as any).deferredPrompt = null
			console.log('[PWA] App installed event captured')
		}

		// オフライン状態のチェック
		const handleOnline = () => {
			setPwaState(prev => ({ ...prev, isOffline: false }))
		}

		const handleOffline = () => {
			setPwaState(prev => ({ ...prev, isOffline: true }))
		}

		// イベントリスナーを追加
		window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt)
		window.addEventListener('appinstalled', handleAppInstalled)
		window.addEventListener('online', handleOnline)
		window.addEventListener('offline', handleOffline)

		// 初期状態を設定
		setPwaState(prev => ({
			...prev,
			isOffline: !navigator.onLine,
		}))

		return () => {
			window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt)
			window.removeEventListener('appinstalled', handleAppInstalled)
			window.removeEventListener('online', handleOnline)
			window.removeEventListener('offline', handleOffline)
		}
	}, [])

	// Service Workerの更新チェック
	useEffect(() => {
		if ('serviceWorker' in navigator) {
			const checkForUpdates = async () => {
				try {
					const registration = await navigator.serviceWorker.getRegistration()
					if (registration) {
						registration.addEventListener('updatefound', () => {
							const newWorker = registration.installing
							if (newWorker) {
								newWorker.addEventListener('statechange', () => {
									if (newWorker.state === 'installed' && navigator.serviceWorker.controller) {
										setPwaState(prev => ({
											...prev,
											isUpdateAvailable: true,
											updateVersion: '新しいバージョンが利用可能です',
										}))
									}
								})
							}
						})
					}
				} catch (error) {
					console.error('Service Worker update check failed:', error)
				}
			}

			checkForUpdates()
		}
	}, [])

	// PWAのインストール
	const installPWA = useCallback(
		async (options?: PWAInstallOptions) => {
			// グローバルのdeferredPromptもチェック
			const prompt = deferredPrompt || (window as any).deferredPrompt
			if (!prompt) {
				throw new Error('インストールプロンプトが利用できません')
			}

			try {
				// カスタムインストールプロンプトを表示
				if (options) {
					await showCustomInstallPrompt(options)
				}

				// ネイティブインストールプロンプトを表示
				await prompt.prompt()
				const { outcome } = await prompt.userChoice

				if (outcome === 'accepted') {
					console.log('PWAがインストールされました')
					setPwaState(prev => ({ ...prev, isInstalled: true, isInstallable: false }))
				} else {
					console.log('PWAのインストールがキャンセルされました')
				}

				setDeferredPrompt(null)
				// グローバルからも削除
				;(window as any).deferredPrompt = null
			} catch (error) {
				console.error('PWAのインストールに失敗しました:', error)
				throw error
			}
		},
		[deferredPrompt]
	)

	// カスタムインストールプロンプトの表示
	const showCustomInstallPrompt = async (options: PWAInstallOptions) => {
		return new Promise<void>(resolve => {
			const {
				title = 'アプリをインストール',
				description = 'ホーム画面に追加して、より快適に使用できます',
				icon = '/SPLT-EDITOR/images/icons/icon-192x192.png',
			} = options

			// カスタムダイアログを作成
			const dialog = document.createElement('div')
			dialog.style.cssText = `
				position: fixed;
				top: 0;
				left: 0;
				width: 100%;
				height: 100%;
				background: rgba(0, 0, 0, 0.5);
				display: flex;
				align-items: center;
				justify-content: center;
				z-index: 10000;
			`

			const content = document.createElement('div')
			content.style.cssText = `
				background: white;
				border-radius: 12px;
				padding: 24px;
				max-width: 400px;
				text-align: center;
				box-shadow: 0 4px 20px rgba(0, 0, 0, 0.15);
			`

			content.innerHTML = `
				<img src="${icon}" alt="アプリアイコン" style="width: 64px; height: 64px; margin-bottom: 16px;">
				<h3 style="margin: 0 0 8px 0; color: #333;">${title}</h3>
				<p style="margin: 0 0 24px 0; color: #666; line-height: 1.5;">${description}</p>
				<div style="display: flex; gap: 12px; justify-content: center;">
					<button id="install-cancel" style="padding: 12px 24px; border: 1px solid #ddd; background: white; border-radius: 6px; cursor: pointer;">キャンセル</button>
					<button id="install-confirm" style="padding: 12px 24px; background: #005fcc; color: white; border: none; border-radius: 6px; cursor: pointer;">インストール</button>
				</div>
			`

			dialog.appendChild(content)
			document.body.appendChild(dialog)

			// イベントリスナーを追加
			const handleCancel = () => {
				document.body.removeChild(dialog)
				resolve()
			}

			const handleConfirm = () => {
				document.body.removeChild(dialog)
				resolve()
			}

			content.querySelector('#install-cancel')?.addEventListener('click', handleCancel)
			content.querySelector('#install-confirm')?.addEventListener('click', handleConfirm)

			// 背景クリックでキャンセル
			dialog.addEventListener('click', e => {
				if (e.target === dialog) {
					handleCancel()
				}
			})
		})
	}

	// Service Workerの更新
	const updateServiceWorker = useCallback(async () => {
		if ('serviceWorker' in navigator) {
			try {
				const registration = await navigator.serviceWorker.getRegistration()
				if (registration && registration.waiting) {
					// 新しいService Workerにメッセージを送信
					registration.waiting.postMessage({ type: 'SKIP_WAITING' })

					// ページをリロード
					window.location.reload()
				}
			} catch (error) {
				console.error('Service Workerの更新に失敗しました:', error)
				throw error
			}
		}
	}, [])

	// オフライン状態の確認
	const checkOfflineStatus = useCallback(() => {
		return !navigator.onLine
	}, [])

	// キャッシュのクリア
	const clearCache = useCallback(async () => {
		if ('caches' in window) {
			try {
				const cacheNames = await caches.keys()
				await Promise.all(cacheNames.map(cacheName => caches.delete(cacheName)))
				console.log('キャッシュがクリアされました')
			} catch (error) {
				console.error('キャッシュのクリアに失敗しました:', error)
				throw error
			}
		}
	}, [])

	// プッシュ通知の許可を要求
	const requestNotificationPermission = useCallback(async () => {
		if ('Notification' in window) {
			try {
				const permission = await Notification.requestPermission()
				return permission === 'granted'
			} catch (error) {
				console.error('通知の許可要求に失敗しました:', error)
				return false
			}
		}
		return false
	}, [])

	// プッシュ通知を送信
	const sendNotification = useCallback((title: string, options?: NotificationOptions) => {
		if ('Notification' in window && Notification.permission === 'granted') {
			return new Notification(title, {
				icon: '/SPLT-EDITOR/images/icons/icon-192x192.png',
				badge: '/SPLT-EDITOR/images/icons/icon-72x72.png',
				...options,
			})
		}
		return null
	}, [])

	return {
		...pwaState,
		installPWA,
		updateServiceWorker,
		checkOfflineStatus,
		clearCache,
		requestNotificationPermission,
		sendNotification,
	}
}
