import { EditorTheme } from '../domain/theme/EditorTheme'
import { saveSettings, loadSettings } from '../usecases/file/settingsUseCase'
import { DEFAULT_SETTING } from '../domain'
import { isTauri } from './isTauri'
import { isPWA } from './pwaDetection'
import { storageServiceFactory } from '../application/storage/StorageService'

/**
 * テーマ変更時に設定を保存する
 * @param theme 新しいテーマ
 */
export async function saveThemeSettings(theme: EditorTheme): Promise<void> {
	try {
		if (isTauri()) {
			// Tauri環境では既存の方法を使用
			let currentSettings
			try {
				currentSettings = await loadSettings()
			} catch (error) {
				currentSettings = { ...DEFAULT_SETTING }
			}

			if (currentSettings) {
				currentSettings.editor.theme = theme
				await saveSettings(currentSettings)
			}
		} else if (isPWA()) {
			// PWA環境では専用のストレージサービスを使用
			const settingsStorageService = storageServiceFactory.createSettingsStorageService()

			// 現在の設定を読み込む
			let currentSettings
			try {
				currentSettings = await settingsStorageService.loadSettings()
				if (!currentSettings) {
					currentSettings = { ...DEFAULT_SETTING }
				}
			} catch (error) {
				currentSettings = { ...DEFAULT_SETTING }
			}

			// テーマを更新して保存
			if (currentSettings) {
				currentSettings.editor.theme = theme
				await settingsStorageService.saveSettings(currentSettings)
			}
		} else {
			// ブラウザ環境では既存の方法を使用
			let currentSettings
			try {
				currentSettings = await loadSettings()
			} catch (error) {
				currentSettings = { ...DEFAULT_SETTING }
			}

			if (currentSettings) {
				currentSettings.editor.theme = theme
				await saveSettings(currentSettings)
			}
		}
	} catch (error) {
		console.error('[ThemeManager] Failed to save theme settings:', error)
	}
}

/**
 * 現在の設定からテーマを取得する
 */
export async function getCurrentTheme(): Promise<EditorTheme | null> {
	try {
		if (isTauri()) {
			// Tauri環境では既存の方法を使用
			const currentSettings = await loadSettings()
			return currentSettings?.editor.theme || null
		} else if (isPWA()) {
			// PWA環境では専用のストレージサービスを使用
			const settingsStorageService = storageServiceFactory.createSettingsStorageService()

			const currentSettings = await settingsStorageService.loadSettings()
			return currentSettings?.editor.theme || null
		} else {
			// ブラウザ環境では既存の方法を使用
			const currentSettings = await loadSettings()
			return currentSettings?.editor.theme || null
		}
	} catch (error) {
		console.error('[ThemeManager] Failed to get current theme:', error)
		return null
	}
}
