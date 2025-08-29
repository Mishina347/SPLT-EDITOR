/// <reference types="vite/client" />

interface ImportMetaEnv {
	readonly VITE_TAURI_PLATFORM?: string
	readonly MODE: string
	readonly DEV: boolean
	readonly PROD: boolean
}

interface ImportMeta {
	readonly env: ImportMetaEnv
}
