/// <reference types="vite/client" />

interface ImportMetaEnv {
	readonly VITE_TAURI_PLATFORM?: string
	readonly TAURI_ENV_DEBUG: boolean
}

interface ImportMeta {
	readonly env: ImportMetaEnv
}
