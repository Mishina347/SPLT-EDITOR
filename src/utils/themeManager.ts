import { EditorTheme } from '../domain/theme/EditorTheme'
import { saveSettings, loadSettings } from '../usecases/settingsUseCase'
import { DEFAULT_SETTING } from '../domain'

/**
 * テーマ変更時に設定を保存する
 * @param theme 新しいテーマ
 */
export async function saveThemeSettings(theme: EditorTheme): Promise<void> {
	try {
		// 現在の設定を読み込む
		let currentSettings
		try {
			currentSettings = await loadSettings()
		} catch (error) {
			currentSettings = { ...DEFAULT_SETTING }
		}

		// テーマを更新
		if (currentSettings) {
			currentSettings.editor.theme = theme
			await saveSettings(currentSettings)
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
		const currentSettings = await loadSettings()
		return currentSettings?.editor.theme || null
	} catch (error) {
		console.error('[ThemeManager] Failed to get current theme:', error)
		return null
	}
}
