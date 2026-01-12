import { Settings, getDefaultSettingForDevice } from '../../domain/entities/defaultSetting'
import { SettingsRepository } from '../../domain/repositories/SettingsRepository'
import { TauriStorageRepository } from '../storage/TauriStorageRepository'
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
	logger.info('TauriSettingsRepository', 'Migrating legacy settings to new format')

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
 * Tauri環境用の設定リポジトリ実装
 * ファイルシステムを使用してデータを永続化
 */
export class TauriSettingsRepository implements SettingsRepository {
	private storageRepo: TauriStorageRepository

	constructor() {
		this.storageRepo = new TauriStorageRepository()
	}

	async loadSettings(): Promise<Settings | null> {
		try {
			logger.info('TauriSettingsRepository', '=== Loading settings from Tauri file system ===')
			const data = await this.storageRepo.loadSettings()

			if (!data || Object.keys(data).length === 0) {
				logger.info('TauriSettingsRepository', 'No settings found in file system')
				return null
			}

			// 古い形式の設定を検出してマイグレーション
			if (isLegacySettings(data)) {
				logger.warn(
					'TauriSettingsRepository',
					'Legacy settings format detected, migrating to new format'
				)
				const migratedSettings = migrateLegacySettings(data)

				// マイグレーション後の設定を保存
				await this.saveSettings(migratedSettings)

				logger.info(
					'TauriSettingsRepository',
					'Settings migrated and saved successfully',
					{
						hasEditor: !!migratedSettings.editor,
						hasPreview: !!migratedSettings.preview,
						fontSize: migratedSettings.editor?.fontSize,
					}
				)

				return migratedSettings
			}

			// 新しい形式の設定
			logger.info('TauriSettingsRepository', 'Settings loaded successfully', {
				hasEditor: !!data.editor,
				hasPreview: !!data.preview,
				fontSize: data.editor?.fontSize,
				theme: data.editor?.theme,
			})

			return data as Settings
		} catch (error) {
			logger.error('TauriSettingsRepository', 'Failed to load settings', {
				error: error instanceof Error ? error.message : String(error),
				stack: error instanceof Error ? error.stack : undefined,
			})
			return null
		}
	}

	async saveSettings(settings: Settings): Promise<void> {
		try {
			logger.info('TauriSettingsRepository', '=== Saving settings to Tauri file system ===', {
				hasEditor: !!settings.editor,
				hasPreview: !!settings.preview,
				fontSize: settings.editor?.fontSize,
				theme: settings.editor?.theme
			})
			await this.storageRepo.saveSettings(settings)
			logger.info('TauriSettingsRepository', '✓ Settings saved successfully to Tauri')
		} catch (error) {
			logger.error('TauriSettingsRepository', '✗ Failed to save settings', {
				error: error instanceof Error ? error.message : String(error),
				stack: error instanceof Error ? error.stack : undefined
			})
			throw error
		}
	}
}
