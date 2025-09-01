import { useCallback, useMemo } from 'react'
import { usePWA } from './usePWA'

// PWAインストール用の型定義
declare global {
	interface Window {
		deferredPrompt: any
	}
}

export const usePWAMenu = () => {
	const {
		isInstallable,
		isInstalled,
		isOffline,
		isUpdateAvailable,
		updateServiceWorker,
		clearCache,
		requestNotificationPermission,
		sendNotification,
	} = usePWA()

	const handleUpdateServiceWorker = useCallback(async () => {
		try {
			await updateServiceWorker()
		} catch (error) {
			console.error('Service Workerの更新に失敗しました:', error)
		}
	}, [updateServiceWorker])

	const handleClearCache = useCallback(async () => {
		try {
			await clearCache()
			console.log('キャッシュがクリアされました')
		} catch (error) {
			console.error('キャッシュのクリアに失敗しました:', error)
		}
	}, [clearCache])

	const handleRequestNotificationPermission = useCallback(async () => {
		try {
			const granted = await requestNotificationPermission()
			if (granted) {
				console.log('通知の許可が得られました')
			}
		} catch (error) {
			console.error('通知の許可要求に失敗しました:', error)
		}
	}, [requestNotificationPermission])

	const handleTestNotification = useCallback(() => {
		try {
			sendNotification('テスト通知', { body: 'PWA通知が正常に動作しています' })
		} catch (error) {
			console.error('テスト通知の送信に失敗しました:', error)
		}
	}, [sendNotification])

	const handlePWAInstall = useCallback(async () => {
		try {
			// PWAインストール処理
			if (window.deferredPrompt) {
				console.log('[PWA] Installing PWA...')
				await window.deferredPrompt.prompt()
				const choiceResult = await window.deferredPrompt.userChoice
				if (choiceResult.outcome === 'accepted') {
					console.log('[PWA] PWAインストールが承認されました')
				} else {
					console.log('[PWA] PWAインストールが拒否されました')
				}
				window.deferredPrompt = null
			} else {
				console.log('[PWA] deferredPrompt not available')
			}
		} catch (error) {
			console.error('[PWA] インストールエラー:', error)
		}
	}, [])

	const isInstallButtonShow = useMemo(() => {
		return isInstallable && !isInstalled && window.deferredPrompt === 'available'
	}, [isInstallable, isInstalled])

	return {
		isInstallable,
		isInstalled,
		isOffline,
		isUpdateAvailable,
		isInstallButtonShow,
		handleUpdateServiceWorker,
		handleClearCache,
		handleRequestNotificationPermission,
		handleTestNotification,
		handlePWAInstall,
	}
}
