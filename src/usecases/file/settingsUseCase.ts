import { readTextFile, writeFile, BaseDirectory } from '@tauri-apps/plugin-fs'
import { DEFAULT_SETTING } from '../../domain'
import { isPWA, isTauri } from '../../utils'
import { storageServiceFactory } from '@/application/storage/StorageService'

const SETTINGS_FILE = 'settings.json'

export async function loadSettings() {
	if (isTauri()) {
		try {
			// ファイルの存在確認を試行
			try {
				const content = await readTextFile(SETTINGS_FILE, { baseDir: BaseDirectory.AppConfig })
				const parsed = JSON.parse(content)
				return parsed
			} catch (readError) {
				try {
					await saveSettings(DEFAULT_SETTING)
					return DEFAULT_SETTING
				} catch (saveError) {
					return DEFAULT_SETTING
				}
			}
		} catch (error) {
			return DEFAULT_SETTING
		}
	} else {
		if (isPWA()) {
			const settingsStorageService = storageServiceFactory.createSettingsStorageService()
			return await settingsStorageService.loadSettings()
		} else {
			// ブラウザ環境 → localStorage から読み込み
			try {
				const content = localStorage.getItem(SETTINGS_FILE)
				if (content) {
					const parsed = JSON.parse(content)
					return parsed
				} else {
					return DEFAULT_SETTING
				}
			} catch (error) {
				console.error('Failed to load settings from localStorage:', error)
				return DEFAULT_SETTING
			}
		}
	}
}

export async function saveSettings(settings: unknown) {
	if (isTauri()) {
		try {
			const encoder = new TextEncoder()
			const data = encoder.encode(JSON.stringify(settings, null, 2))
			await writeFile(SETTINGS_FILE, data, { baseDir: BaseDirectory.AppConfig })
		} catch (error) {
			throw error
		}
	} else {
		if (isPWA()) {
			const settingsStorageService = storageServiceFactory.createSettingsStorageService()
			await settingsStorageService.saveSettings(settings)
		} else {
			// ブラウザ環境 → localStorage に保存
			try {
				localStorage.setItem(SETTINGS_FILE, JSON.stringify(settings, null, 2))
			} catch (error) {
				console.error('Failed to save settings to localStorage:', error)
				throw error
			}
		}
	}
}
