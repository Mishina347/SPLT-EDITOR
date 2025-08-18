import { readTextFile, writeFile, BaseDirectory } from '@tauri-apps/plugin-fs'
import { DEFAULT_SETTING } from '../domain'
import { isTauri } from '../utils'

const SETTINGS_FILE = 'settings.json'

export async function loadSettings() {
	if (isTauri()) {
		try {
			const content = await readTextFile(SETTINGS_FILE, { baseDir: BaseDirectory.AppConfig })
			return JSON.parse(content)
		} catch (error) {
			await saveSettings(DEFAULT_SETTING)
			return DEFAULT_SETTING
		}
	} else {
		// ブラウザ環境 → localStorage から読み込み
		try {
			const content = localStorage.getItem(SETTINGS_FILE)
			return content ? JSON.parse(content) : DEFAULT_SETTING
		} catch (error) {
			return DEFAULT_SETTING
		}
	}
}

export async function saveSettings(settings: unknown) {
	if (isTauri()) {
		const encoder = new TextEncoder()
		const data = encoder.encode(JSON.stringify(settings, null, 2))
		await writeFile(SETTINGS_FILE, data, { baseDir: BaseDirectory.AppConfig })
	} else {
		// ブラウザ環境 → localStorage に保存
		localStorage.setItem(SETTINGS_FILE, JSON.stringify(settings, null, 2))
	}
}
