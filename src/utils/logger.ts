import { LogLevel, LoggerConfig } from '../types/common'

// Vite環境変数の型定義
declare global {
	interface ImportMetaEnv {
		readonly DEV: boolean
		readonly VITE_TAURI_PLATFORM: string | undefined
	}

	interface ImportMeta {
		readonly env: ImportMetaEnv
	}
}

class Logger {
	private config: LoggerConfig

	constructor(config: LoggerConfig) {
		this.config = config
	}

	private shouldLog(level: LogLevel): boolean {
		const levels: LogLevel[] = ['debug', 'info', 'warn', 'error']
		const currentLevelIndex = levels.indexOf(this.config.level)
		const messageLevelIndex = levels.indexOf(level)

		return messageLevelIndex >= currentLevelIndex
	}

	private formatMessage(level: LogLevel, component: string, message: string, data?: any): string {
		const timestamp = new Date().toISOString()
		const prefix = `[${timestamp}] [${level.toUpperCase()}] [${component}]`
		return `${prefix} ${message}`
	}

	debug(component: string, message: string, data?: any): void {
		if (this.shouldLog('debug') && this.config.enableDebug) {
			const formattedMessage = this.formatMessage('debug', component, message, data)
			if (data) {
				console.log(formattedMessage, data)
			} else {
				console.log(formattedMessage)
			}
		}
	}

	info(component: string, message: string, data?: any): void {
		if (this.shouldLog('info') && this.config.enableConsole) {
			const formattedMessage = this.formatMessage('info', component, message, data)
			if (data) {
				console.log(formattedMessage, data)
			} else {
				console.log(formattedMessage)
			}
		}
	}

	warn(component: string, message: string, data?: any): void {
		if (this.shouldLog('warn') && this.config.enableConsole) {
			const formattedMessage = this.formatMessage('warn', component, message, data)
			if (data) {
				console.warn(formattedMessage, data)
			} else {
				console.warn(formattedMessage)
			}
		}
	}

	error(component: string, message: string, error?: any): void {
		if (this.shouldLog('error') && this.config.enableConsole) {
			const formattedMessage = this.formatMessage('error', component, message, error)
			if (error) {
				console.error(formattedMessage, error)
			} else {
				console.error(formattedMessage)
			}
		}
	}
}

// 環境に応じた設定
// 環境変数の安全な取得
const getEnvVar = (key: string): string | undefined => {
	try {
		return (globalThis as any).import?.meta?.env?.[key] || process?.env?.[key]
	} catch {
		return undefined
	}
}

const isDevelopment = getEnvVar('DEV') === 'true' || getEnvVar('NODE_ENV') === 'development'
const isTauri = getEnvVar('VITE_TAURI_PLATFORM') === 'desktop'

export const logger = new Logger({
	level: isDevelopment ? 'debug' : 'warn',
	enableDebug: isDevelopment,
	enableConsole: isDevelopment || isTauri,
})

export default logger
