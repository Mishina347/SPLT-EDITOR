import { readTextFile, writeFile, BaseDirectory } from '@tauri-apps/plugin-fs'
import { DEFAULT_SETTING } from '../domain'
import { isTauri } from '../utils'

const SETTINGS_FILE = 'settings.json'

export async function loadSettings() {
	console.log('[Settings] Starting to load settings...')
	console.log('[Settings] Environment:', isTauri() ? 'Tauri' : 'Browser')

	if (isTauri()) {
		try {
			console.log('[Settings] Attempting to read from Tauri AppConfig directory...')
			const content = await readTextFile(SETTINGS_FILE, { baseDir: BaseDirectory.AppConfig })
			console.log('[Settings] Successfully read settings file')
			const parsed = JSON.parse(content)
			console.log('[Settings] Successfully parsed settings:', parsed)
			return parsed
		} catch (error) {
			console.error('[Settings] Failed to read settings from Tauri:', error)
			console.log('[Settings] Attempting to save default settings...')

			try {
				await saveSettings(DEFAULT_SETTING)
				console.log('[Settings] Successfully saved default settings')
				return DEFAULT_SETTING
			} catch (saveError) {
				console.error('[Settings] Failed to save default settings:', saveError)
				console.log('[Settings] Returning default settings from memory')
				return DEFAULT_SETTING
			}
		}
	} else {
		// ブラウザ環境 → localStorage から読み込み
		try {
			console.log('[Settings] Attempting to read from localStorage...')
			const content = localStorage.getItem(SETTINGS_FILE)
			if (content) {
				const parsed = JSON.parse(content)
				console.log('[Settings] Successfully loaded from localStorage:', parsed)
				return parsed
			} else {
				console.log('[Settings] No settings in localStorage, using default')
				return DEFAULT_SETTING
			}
		} catch (error) {
			console.error('[Settings] Failed to read from localStorage:', error)
			console.log('[Settings] Returning default settings')
			return DEFAULT_SETTING
		}
	}
}

export async function saveSettings(settings: unknown) {
	console.log('[Settings] Starting to save settings...')
	console.log('[Settings] Settings to save:', settings)

	if (isTauri()) {
		try {
			console.log('[Settings] Attempting to save to Tauri AppConfig directory...')
			const encoder = new TextEncoder()
			const data = encoder.encode(JSON.stringify(settings, null, 2))
			await writeFile(SETTINGS_FILE, data, { baseDir: BaseDirectory.AppConfig })
			console.log('[Settings] Successfully saved settings to Tauri')
		} catch (error) {
			console.error('[Settings] Failed to save settings to Tauri:', error)
			throw error
		}
	} else {
		// ブラウザ環境 → localStorage に保存
		try {
			console.log('[Settings] Attempting to save to localStorage...')
			localStorage.setItem(SETTINGS_FILE, JSON.stringify(settings, null, 2))
			console.log('[Settings] Successfully saved settings to localStorage')
		} catch (error) {
			console.error('[Settings] Failed to save settings to localStorage:', error)
			throw error
		}
	}
}
