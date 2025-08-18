import { invoke } from '@tauri-apps/api/core'
import { Settings, SettingsRepository } from '../../domain/entities/defaultSetting'

export class TauriSettingsRepository implements SettingsRepository {
	async loadSettings(): Promise<Settings> {
		try {
			return await invoke<Settings>('load_settings')
		} catch (error) {
			console.warn('settings.json がないため生成します')
			const defaultSettings: Settings = {
				editor: {
					fontSize: 16,
					wordWrapColumn: 60,
					backgroundColor: '#ffffff',
					textColor: '#000000',
				},
				preview: {
					charsPerLine: 20,
					linesPerPage: 20,
				},
			}
			await this.saveSettings(defaultSettings)
			return defaultSettings
		}
	}

	async saveSettings(settings: Settings): Promise<void> {
		await invoke('save_settings', { settings })
	}
}
