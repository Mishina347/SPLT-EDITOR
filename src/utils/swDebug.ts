// Service Workerの動作確認用デバッグユーティリティ

/**
 * Service Workerの状態を確認
 */
export function checkServiceWorkerStatus(): void {
	if (!('serviceWorker' in navigator)) {
		console.log('❌ Service Worker API is not available')
		return
	}

	navigator.serviceWorker.getRegistrations().then(registrations => {
		if (registrations.length === 0) {
			return
		}

		registrations.forEach((registration, index) => {
			console.log(`\n🔍 Registration ${index + 1}:`)
			console.log(`   Scope: ${registration.scope}`)
			console.log(`   Active: ${registration.active ? '✅' : '❌'}`)
			console.log(`   Installing: ${registration.installing ? '⏳' : '❌'}`)
			console.log(`   Waiting: ${registration.waiting ? '⏳' : '❌'}`)

			if (registration.active) {
				console.log(`   Active SW State: ${registration.active.state}`)
			}
		})
	})
}

/**
 * Service Workerのキャッシュを確認
 */
export async function checkServiceWorkerCache(): Promise<void> {
	if (!('caches' in window)) {
		console.log('❌ Cache API is not available')
		return
	}

	console.log('✅ Cache API is available')

	try {
		const cacheNames = await caches.keys()
		console.log(`📦 Found ${cacheNames.length} cache(s):`, cacheNames)

		for (const cacheName of cacheNames) {
			const cache = await caches.open(cacheName)
			const keys = await cache.keys()
			console.log(`   ${cacheName}: ${keys.length} items`)

			// 最初の5件のみ表示
			keys.slice(0, 5).forEach((request, index) => {
				console.log(`     ${index + 1}. ${request.url}`)
			})

			if (keys.length > 5) {
				console.log(`     ... and ${keys.length - 5} more items`)
			}
		}
	} catch (error) {
		console.error('❌ Error checking cache:', error)
	}
}

/**
 * Service Workerを強制的に更新
 */
export function forceServiceWorkerUpdate(): void {
	if (!('serviceWorker' in navigator)) {
		console.log('❌ Service Worker API is not available')
		return
	}

	navigator.serviceWorker.getRegistrations().then(registrations => {
		registrations.forEach(registration => {
			if (registration.waiting) {
				console.log('🔄 Found waiting Service Worker, posting skipWaiting message')
				registration.waiting.postMessage({ type: 'SKIP_WAITING' })
			} else {
				console.log('ℹ️ No waiting Service Worker found')
			}
		})
	})
}

/**
 * Service Workerのキャッシュをクリア
 */
export async function clearServiceWorkerCache(): Promise<void> {
	if (!('caches' in window)) {
		console.log('❌ Cache API is not available')
		return
	}

	try {
		const cacheNames = await caches.keys()
		console.log(`🗑️ Clearing ${cacheNames.length} cache(s)...`)

		await Promise.all(cacheNames.map(cacheName => caches.delete(cacheName)))
		console.log('✅ All caches cleared')
	} catch (error) {
		console.error('❌ Error clearing cache:', error)
	}
}

/**
 * すべてのService Workerをアンインストール
 */
export async function uninstallAllServiceWorkers(): Promise<void> {
	if (!('serviceWorker' in navigator)) {
		console.log('❌ Service Worker API is not available')
		return
	}

	try {
		const registrations = await navigator.serviceWorker.getRegistrations()
		console.log(`🗑️ Uninstalling ${registrations.length} Service Worker(s)...`)

		await Promise.all(registrations.map(registration => registration.unregister()))
		console.log('✅ All Service Workers uninstalled')
	} catch (error) {
		console.error('❌ Error uninstalling Service Workers:', error)
	}
}

// グローバルにデバッグ関数を公開（開発時のみ）
if (process.env.NODE_ENV === 'development') {
	;(window as any).swDebug = {
		checkStatus: checkServiceWorkerStatus,
		checkCache: checkServiceWorkerCache,
		forceUpdate: forceServiceWorkerUpdate,
		clearCache: clearServiceWorkerCache,
		uninstallAll: uninstallAllServiceWorkers,
	}

	console.log('🔧 Service Worker Debug tools available:')
	console.log('   window.swDebug.checkStatus() - SWの状態確認')
	console.log('   window.swDebug.checkCache() - キャッシュの確認')
	console.log('   window.swDebug.forceUpdate() - SWの強制更新')
	console.log('   window.swDebug.clearCache() - キャッシュのクリア')
	console.log('   window.swDebug.uninstallAll() - 全SWのアンインストール')
}
