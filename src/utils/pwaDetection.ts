/**
 * PWA環境の検知ユーティリティ
 */
export function isPWA(): boolean {
	// 1. display-mode: standalone のチェック
	const isStandalone = window.matchMedia('(display-mode: standalone)').matches

	// 2. iOS Safariのstandaloneチェック
	const isIOSStandalone = (window.navigator as any).standalone === true

	// 3. Service Workerが登録されているかチェック
	const hasServiceWorker = 'serviceWorker' in navigator

	// 4. PWAインストール済みかチェック
	const isInstalled = isStandalone || isIOSStandalone

	// 5. windowがwindow.openerを持たない場合（PWAとして起動）
	const isWindowOpener = window.opener === null

	// 6. referrerが空の場合（直接起動）
	const isDirectLaunch = !document.referrer

	console.log('[PWA Detection]', {
		isStandalone,
		isIOSStandalone,
		hasServiceWorker,
		isInstalled,
		isWindowOpener,
		isDirectLaunch,
		userAgent: navigator.userAgent,
		referrer: document.referrer,
	})

	// PWAとして起動している条件
	return isInstalled && hasServiceWorker && isWindowOpener && isDirectLaunch
}

/**
 * PWAとしてインストールされているかチェック
 */
export function isPWAInstalled(): boolean {
	const isStandalone = window.matchMedia('(display-mode: standalone)').matches
	const isIOSStandalone = (window.navigator as any).standalone === true
	return isStandalone || isIOSStandalone
}

/**
 * PWAインストール可能かチェック
 */
export function isPWAInstallable(): boolean {
	const isInstalled = isPWAInstalled()
	const hasServiceWorker = 'serviceWorker' in navigator
	return !isInstalled && hasServiceWorker
}

/**
 * PWAの起動モードを取得
 */
export function getPWAMode(): 'browser' | 'pwa' | 'unknown' {
	if (isPWA()) {
		return 'pwa'
	} else if (isPWAInstallable()) {
		return 'browser'
	} else {
		return 'unknown'
	}
}

/**
 * PWAの詳細情報を取得
 */
export function getPWADetails() {
	return {
		isPWA: isPWA(),
		isInstalled: isPWAInstalled(),
		isInstallable: isPWAInstallable(),
		mode: getPWAMode(),
		hasServiceWorker: 'serviceWorker' in navigator,
		displayMode: window.matchMedia('(display-mode: standalone)').matches,
		userAgent: navigator.userAgent,
		referrer: document.referrer,
	}
}
