import { invoke } from '@tauri-apps/api/core'
import { EditorSettings } from '../domain'
import { FileDataRepository } from '../adapters'
import { isTauri } from '../utils'

export class FileSettingsRepo implements FileDataRepository {
	async load(): Promise<EditorSettings | null> {
		if (isTauri()) {
			try {
				return await invoke<EditorSettings>('load_settings')
			} catch (err) {
				console.error('Failed to load settings:', err)
				return null
			}
		} else {
			// ブラウザ環境 → localStorage から読み込み
			try {
				const content = localStorage.getItem('settings.json')
				return content ? JSON.parse(content) : null
			} catch (err) {
				console.error('Failed to load settings from localStorage:', err)
				return null
			}
		}
	}

	async save(settings: EditorSettings): Promise<void> {
		if (isTauri()) {
			try {
				console.log('FileSettingsRepo save')
				await invoke<EditorSettings>('save_settings', { settings })
			} catch (err) {
				console.error('Failed to save settings:', err)
			}
		} else {
			// ブラウザ環境 → localStorage に保存
			try {
				console.log('FileSettingsRepo save to localStorage')
				localStorage.setItem('settings.json', JSON.stringify(settings, null, 2))
			} catch (err) {
				console.error('Failed to save settings to localStorage:', err)
			}
		}
	}
}
