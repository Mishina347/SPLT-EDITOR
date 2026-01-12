import { Settings, getDefaultSettingForDevice } from '../../domain/entities/defaultSetting'
import { SettingsRepository } from '../../domain/repositories/SettingsRepository'
import { logger } from '../../utils/logger'

const SETTINGS_KEY = 'settings.json'

/**
 * 古い形式の設定（フラット構造）を検出
 */
function isLegacySettings(data: any): boolean {
	return (
		data &&
		typeof data === 'object' &&
		'fontSize' in data &&
		!('editor' in data) &&
		!('preview' in data)
	)
}

/**
 * 古い形式の設定を新しい形式に変換
 */
function migrateLegacySettings(legacy: any): Settings {
	logger.info('BrowserSettingsRepository', 'Migrating legacy settings to new format')

	const defaultSettings = getDefaultSettingForDevice()

	return {
		editor: {
			fontSize: legacy.fontSize || defaultSettings.editor.fontSize,
			wordWrapColumn: legacy.wordWrapColumn || defaultSettings.editor.wordWrapColumn,
			backgroundColor: legacy.backgroundColor || defaultSettings.editor.backgroundColor,
			textColor: legacy.textColor || defaultSettings.editor.textColor,
			fontFamily: legacy.fontFamily || defaultSettings.editor.fontFamily,
			theme: legacy.theme || defaultSettings.editor.theme,
			autoSave: legacy.autoSave || defaultSettings.editor.autoSave,
		},
		preview: defaultSettings.preview,
		resizerRatio: defaultSettings.resizerRatio,
	}
}

/**
 * ブラウザ環境用の設定リポジトリ実装
 * localStorageを使用してデータを永続化
 */
export class BrowserSettingsRepository implements SettingsRepository {
	async loadSettings(): Promise<Settings | null> {
		try {
			logger.debug('BrowserSettingsRepository', 'Loading settings from localStorage')
			const content = localStorage.getItem(SETTINGS_KEY)

			if (!content) {
				logger.debug('BrowserSettingsRepository', 'No settings found in localStorage')
				return null
			}

			const data = JSON.parse(content)

			// 古い形式の設定を検出してマイグレーション
			if (isLegacySettings(data)) {
				logger.warn(
					'BrowserSettingsRepository',
					'Legacy settings format detected, migrating to new format'
				)
				const migratedSettings = migrateLegacySettings(data)

				// マイグレーション後の設定を保存
				await this.saveSettings(migratedSettings)

				logger.info('BrowserSettingsRepository', 'Settings migrated and saved successfully')

				return migratedSettings
			}

			logger.info('BrowserSettingsRepository', 'Settings loaded successfully', data)
			return data as Settings
		} catch (error) {
			logger.error('BrowserSettingsRepository', 'Failed to load settings', error)
			return null
		}
	}

	async saveSettings(settings: Settings): Promise<void> {
		try {
			logger.debug('BrowserSettingsRepository', 'Saving settings to localStorage', settings)
			localStorage.setItem(SETTINGS_KEY, JSON.stringify(settings, null, 2))
			logger.info('BrowserSettingsRepository', 'Settings saved successfully')
		} catch (error) {
			logger.error('BrowserSettingsRepository', 'Failed to save settings', error)
			throw error
		}
	}
}
