import {
	SettingsStorageRepository,
	ThemeStorageRepository,
} from '../../domain/storage/StorageRepository'
import { readTextFile, writeFile, BaseDirectory } from '@tauri-apps/plugin-fs'
import { logger } from '../../utils/logger'

const SETTINGS_FILE = 'settings.json'
const THEME_FILE = 'theme_settings.json'

/**
 * Tauri環境用のファイルシステムベースストレージリポジトリ
 */
export class TauriStorageRepository implements SettingsStorageRepository, ThemeStorageRepository {
	async save(key: string, value: any): Promise<void> {
		try {
			const encoder = new TextEncoder()
			const data = encoder.encode(JSON.stringify(value, null, 2))
			await writeFile(key, data, { baseDir: BaseDirectory.AppConfig })
			logger.debug('TauriStorageRepository', 'Item saved successfully', { key })
		} catch (error) {
			logger.error('TauriStorageRepository', 'Failed to save item', error)
			throw error
		}
	}

	async load(key: string): Promise<any> {
		try {
			const content = await readTextFile(key, { baseDir: BaseDirectory.AppConfig })
			const parsed = JSON.parse(content)
			logger.debug('TauriStorageRepository', 'Item loaded successfully', { key })
			return parsed
		} catch (error) {
			logger.debug('TauriStorageRepository', 'Item not found or failed to load', { key })
			return null
		}
	}

	async remove(key: string): Promise<void> {
		try {
			// Tauriではファイルの削除は別途APIが必要
			// 現在は空のオブジェクトで上書き
			await this.save(key, {})
			logger.debug('TauriStorageRepository', 'Item removed successfully', { key })
		} catch (error) {
			logger.error('TauriStorageRepository', 'Failed to remove item', error)
			throw error
		}
	}

	async clear(): Promise<void> {
		try {
			// Tauriでは全ファイルの削除は複雑なため、主要ファイルのみクリア
			await this.save(SETTINGS_FILE, {})
			await this.save(THEME_FILE, {})
			logger.debug('TauriStorageRepository', 'Storage cleared successfully')
		} catch (error) {
			logger.error('TauriStorageRepository', 'Failed to clear storage', error)
			throw error
		}
	}

	isAvailable(): boolean {
		// Tauri環境では常に利用可能
		return true
	}

	// SettingsStorageRepository の実装
	async saveSettings(settings: any): Promise<void> {
		return await this.save(SETTINGS_FILE, settings)
	}

	async loadSettings(): Promise<any> {
		return await this.load(SETTINGS_FILE)
	}

	// ThemeStorageRepository の実装
	async saveThemeSettings(themeSettings: any): Promise<void> {
		return await this.save(THEME_FILE, themeSettings)
	}

	async loadThemeSettings(): Promise<any> {
		return await this.load(THEME_FILE)
	}
}
