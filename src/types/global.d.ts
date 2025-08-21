// グローバルな型定義

declare global {
	interface Window {
		isDevelopment: boolean
		basePath: string
		deferredPrompt: any
	}
}

export {}
