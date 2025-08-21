// 画像ファイルの型定義
declare module '*.png' {
	const src: string
	export default src
}

declare module '*.jpg' {
	const src: string
	export default src
}

declare module '*.jpeg' {
	const src: string
	export default src
}

declare module '*.gif' {
	const src: string
	export default src
}

declare module '*.svg' {
	const src: string
	export default src
}

declare module '*.webp' {
	const src: string
	export default src
}

// 画像ファイルのURLを取得するためのユーティリティ型
export interface ImageAsset {
	src: string
	alt?: string
	width?: number
	height?: number
}

// PWAアイコンの型定義
export interface PWAIcon {
	src: string
	sizes: string
	type: string
	purpose?: string
}

// スプラッシュスクリーンの型定義
export interface SplashScreen {
	width: number
	height: number
	media: string
	src: string
}
