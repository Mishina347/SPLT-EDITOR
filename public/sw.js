const CACHE_NAME = 'splt-editor-v1.0.0'
const STATIC_CACHE_NAME = 'splt-editor-static-v1.0.0'
const DYNAMIC_CACHE_NAME = 'splt-editor-dynamic-v1.0.0'

// キャッシュする静的ファイル
const STATIC_FILES = [
	'/',
	'/index.html',
	'/manifest.json',
	'/images/icons/icon-72x72.png',
	'/images/icons/icon-96x96.png',
	'/images/icons/icon-128x128.png',
	'/images/icons/icon-144x144.png',
	'/images/icons/icon-152x152.png',
	'/images/icons/icon-192x192.png',
	'/images/icons/icon-384x384.png',
	'/images/icons/icon-512x512.png',
]

// キャッシュしないファイル（API、外部リソースなど）
const EXCLUDE_FILES = [
	'/api/',
	'chrome-extension://',
	'moz-extension://',
	'ms-browser-extension://',
]

// インストール時の処理
self.addEventListener('install', event => {
	console.log('[SW] Service Worker installing...')

	event.waitUntil(
		caches
			.open(STATIC_CACHE_NAME)
			.then(cache => {
				console.log('[SW] Caching static files')
				return cache.addAll(STATIC_FILES)
			})
			.then(() => {
				console.log('[SW] Static files cached successfully')
				return self.skipWaiting()
			})
			.catch(error => {
				console.error('[SW] Failed to cache static files:', error)
			})
	)
})

// アクティベート時の処理
self.addEventListener('activate', event => {
	console.log('[SW] Service Worker activating...')

	event.waitUntil(
		caches
			.keys()
			.then(cacheNames => {
				return Promise.all(
					cacheNames.map(cacheName => {
						// 古いキャッシュを削除
						if (cacheName !== STATIC_CACHE_NAME && cacheName !== DYNAMIC_CACHE_NAME) {
							console.log('[SW] Deleting old cache:', cacheName)
							return caches.delete(cacheName)
						}
					})
				)
			})
			.then(() => {
				console.log('[SW] Service Worker activated')
				return self.clients.claim()
			})
	)
})

// フェッチ時の処理（ネットワークファースト戦略）
self.addEventListener('fetch', event => {
	const { request } = event
	const url = new URL(request.url)

	// 除外ファイルのチェック
	if (EXCLUDE_FILES.some(pattern => url.href.includes(pattern))) {
		return
	}

	// 静的ファイルの処理
	if (STATIC_FILES.includes(url.pathname)) {
		event.respondWith(
			caches.match(request).then(response => {
				if (response) {
					return response
				}
				return fetch(request).then(fetchResponse => {
					if (fetchResponse.status === 200) {
						const responseClone = fetchResponse.clone()
						caches.open(STATIC_CACHE_NAME).then(cache => {
							cache.put(request, responseClone)
						})
					}
					return fetchResponse
				})
			})
		)
		return
	}

	// 動的ファイルの処理（HTML、JS、CSS）
	if (
		request.destination === 'document' ||
		request.destination === 'script' ||
		request.destination === 'style'
	) {
		event.respondWith(
			fetch(request)
				.then(response => {
					if (response.status === 200) {
						const responseClone = response.clone()
						caches.open(DYNAMIC_CACHE_NAME).then(cache => {
							cache.put(request, responseClone)
						})
					}
					return response
				})
				.catch(() => {
					// ネットワークエラー時はキャッシュから取得
					return caches.match(request).then(response => {
						if (response) {
							return response
						}
						// フォールバックページ
						if (request.destination === 'document') {
							return caches.match('/')
						}
					})
				})
		)
		return
	}

	// その他のリクエスト（画像、フォントなど）
	event.respondWith(
		caches.match(request).then(response => {
			if (response) {
				return response
			}
			return fetch(request).then(fetchResponse => {
				if (fetchResponse.status === 200) {
					const responseClone = fetchResponse.clone()
					caches.open(DYNAMIC_CACHE_NAME).then(cache => {
						cache.put(request, responseClone)
					})
				}
				return fetchResponse
			})
		})
	)
})

// バックグラウンド同期（オフライン時のデータ同期）
self.addEventListener('sync', event => {
	console.log('[SW] Background sync triggered:', event.tag)

	if (event.tag === 'background-sync') {
		event.waitUntil(
			// オフライン時のデータを同期
			syncOfflineData().then(() => {
				console.log('[SW] Background sync completed')
			})
		)
	}
})

// オフラインデータの同期
async function syncOfflineData() {
	try {
		// IndexedDBからオフラインデータを取得
		const offlineData = await getOfflineData()

		if (offlineData && offlineData.length > 0) {
			console.log('[SW] Syncing offline data:', offlineData.length, 'items')

			// データを同期
			for (const data of offlineData) {
				await syncDataItem(data)
			}

			// 同期完了後、オフラインデータをクリア
			await clearOfflineData()
			console.log('[SW] Offline data synced successfully')
		}
	} catch (error) {
		console.error('[SW] Failed to sync offline data:', error)
	}
}

// IndexedDBからオフラインデータを取得
async function getOfflineData() {
	// 実際の実装ではIndexedDBを使用
	// ここでは簡略化
	return []
}

// データアイテムの同期
async function syncDataItem(data) {
	// 実際の実装ではAPIにデータを送信
	console.log('[SW] Syncing data item:', data)
}

// オフラインデータのクリア
async function clearOfflineData() {
	// 実際の実装ではIndexedDBをクリア
	console.log('[SW] Clearing offline data')
}

// メッセージの処理
self.addEventListener('message', event => {
	console.log('[SW] Message received:', event.data)

	if (event.data && event.data.type === 'SKIP_WAITING') {
		self.skipWaiting()
	}

	if (event.data && event.data.type === 'GET_VERSION') {
		event.ports[0].postMessage({ version: CACHE_NAME })
	}
})
