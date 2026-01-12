import { Settings, getDefaultSettingForDevice } from '../../domain/entities/defaultSetting'
import { SettingsRepository } from '../../domain/repositories/SettingsRepository'
import { PWAStorageRepository } from '../storage/PWAStorageRepository'
import { logger } from '../../utils/logger'

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
	logger.info('PWASettingsRepository', 'Migrating legacy settings to new format')

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
 * PWA環境用の設定リポジトリ実装
 * IndexedDBとlocalStorageを併用してデータの永続化を実現
 */
export class PWASettingsRepository implements SettingsRepository {
	private storageRepo: PWAStorageRepository

	constructor() {
		this.storageRepo = new PWAStorageRepository()
	}

	async loadSettings(): Promise<Settings | null> {
		try {
			logger.debug('PWASettingsRepository', 'Loading settings from PWA storage')
			const data = await this.storageRepo.loadSettings()

			if (!data || Object.keys(data).length === 0) {
				logger.debug('PWASettingsRepository', 'No settings found in PWA storage')
				return null
			}

			// 古い形式の設定を検出してマイグレーション
			if (isLegacySettings(data)) {
				logger.warn(
					'PWASettingsRepository',
					'Legacy settings format detected, migrating to new format'
				)
				const migratedSettings = migrateLegacySettings(data)

				// マイグレーション後の設定を保存
				await this.saveSettings(migratedSettings)

				logger.info('PWASettingsRepository', 'Settings migrated and saved successfully')

				return migratedSettings
			}

			logger.info('PWASettingsRepository', 'Settings loaded successfully', data)
			return data as Settings
		} catch (error) {
			logger.error('PWASettingsRepository', 'Failed to load settings', error)
			return null
		}
	}

	async saveSettings(settings: Settings): Promise<void> {
		try {
			logger.debug('PWASettingsRepository', 'Saving settings to PWA storage', settings)
			await this.storageRepo.saveSettings(settings)
			logger.info('PWASettingsRepository', 'Settings saved successfully')
		} catch (error) {
			logger.error('PWASettingsRepository', 'Failed to save settings', error)
			throw error
		}
	}
}
