// 画像ファイルのパスを動的に生成するユーティリティ

/**
 * 開発時と本番時で適切なベースパスを取得
 */
export const getBasePath = (): string => {
	const isDevelopment =
		window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1'
	return isDevelopment ? '' : '/SPLT-EDITOR'
}

/**
 * PWAアイコンのパスを生成
 */
export const getIconPath = (size: number): string => {
	const basePath = getBasePath()
	return `${basePath}/icons/icon-${size}x${size}.png`
}

/**
 * スプラッシュスクリーンのパスを生成
 */
export const getSplashPath = (width: number, height: number): string => {
	const basePath = getBasePath()
	return `${basePath}/splash/apple-splash-${width}-${height}.png`
}

/**
 * スクリーンショットのパスを生成
 */
export const getScreenshotPath = (filename: string): string => {
	const basePath = getBasePath()
	return `${basePath}/screenshots/${filename}`
}

/**
 * ファビコンのパスを生成
 */
export const getFaviconPath = (): string => {
	const basePath = getBasePath()
	return `${basePath}/icons/icon-32x32.png`
}

/**
 * マニフェストファイルのパスを生成
 */
export const getManifestPath = (): string => {
	const basePath = getBasePath()
	return `${basePath}/manifest.json`
}

/**
 * Service Workerのパスを生成
 */
export const getServiceWorkerPath = (): string => {
	const basePath = getBasePath()
	return basePath ? `${basePath}/sw.js` : '/sw.js'
}

/**
 * 必要なPWAアイコンサイズの一覧
 */
export const PWA_ICON_SIZES = [72, 96, 128, 144, 152, 192, 384, 512] as const

/**
 * 必要なApple Touch Iconサイズの一覧
 */
export const APPLE_TOUCH_ICON_SIZES = [57, 60, 72, 76, 114, 120, 144, 152, 180] as const

/**
 * スプラッシュスクリーンの設定一覧
 */
export const SPLASH_SCREENS = [
	{
		width: 640,
		height: 1136,
		media:
			'(device-width: 320px) and (device-height: 568px) and (-webkit-device-pixel-ratio: 2) and (orientation: portrait)',
	},
	{
		width: 750,
		height: 1334,
		media:
			'(device-width: 375px) and (device-height: 667px) and (-webkit-device-pixel-ratio: 2) and (orientation: portrait)',
	},
	{
		width: 1125,
		height: 2436,
		media:
			'(device-width: 375px) and (device-height: 812px) and (-webkit-device-pixel-ratio: 3) and (orientation: portrait)',
	},
	{
		width: 1242,
		height: 2688,
		media:
			'(device-width: 414px) and (device-height: 896px) and (-webkit-device-pixel-ratio: 3) and (orientation: portrait)',
	},
	{
		width: 1536,
		height: 2048,
		media:
			'(device-width: 768px) and (device-height: 1024px) and (-webkit-device-pixel-ratio: 2) and (orientation: portrait)',
	},
	{
		width: 1668,
		height: 2388,
		media:
			'(device-width: 834px) and (device-height: 1194px) and (-webkit-device-pixel-ratio: 2) and (orientation: portrait)',
	},
	{
		width: 2048,
		height: 2732,
		media:
			'(device-width: 1024px) and (device-height: 1366px) and (-webkit-device-pixel-ratio: 2) and (orientation: portrait)',
	},
] as const
