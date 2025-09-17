import { Settings } from '../../domain'
import { FileDataRepository } from './FileDataRepository'
import { logger } from '../../utils/logger'
import { isTauri } from '../../utils'
import { readTextFile, writeFile, BaseDirectory } from '@tauri-apps/plugin-fs'

const SETTINGS_FILE = 'settings.json'

export class FileDataRepositoryImpl implements FileDataRepository {
	async load(): Promise<Settings | null> {
		try {
			const tauriEnv = isTauri()
			logger.debug('FileDataRepositoryImpl', `Loading settings - isTauri: ${tauriEnv}`)

			if (tauriEnv) {
				// Tauri環境 → ファイルシステムから読み込み
				try {
					const content = await readTextFile(SETTINGS_FILE, {
						baseDir: BaseDirectory.AppConfig,
					})
					const parsed = JSON.parse(content)
					logger.debug('FileDataRepositoryImpl', 'Settings loaded from file system', parsed)
					return parsed
				} catch (readError) {
					logger.warn(
						'FileDataRepositoryImpl',
						'Failed to read settings file, returning null',
						readError
					)
					return null
				}
			} else {
				// ブラウザ環境 → localStorage から読み込み
				try {
					const content = localStorage.getItem(SETTINGS_FILE)
					if (content) {
						const parsed = JSON.parse(content)
						logger.debug('FileDataRepositoryImpl', 'Settings loaded from localStorage', parsed)
						return parsed
					} else {
						logger.debug('FileDataRepositoryImpl', 'No settings found in localStorage')
						return null
					}
				} catch (error) {
					logger.error('FileDataRepositoryImpl', 'Failed to load settings from localStorage', error)
					return null
				}
			}
		} catch (error) {
			logger.error('FileDataRepositoryImpl', 'Failed to load settings', error)
			return null
		}
	}

	async save(settings: Settings): Promise<void> {
		try {
			logger.debug('FileDataRepositoryImpl', 'Saving settings', settings)

			if (isTauri()) {
				// Tauri環境 → ファイルシステムに保存
				try {
					const encoder = new TextEncoder()
					const data = encoder.encode(JSON.stringify(settings, null, 2))
					await writeFile(SETTINGS_FILE, data, {
						baseDir: BaseDirectory.AppConfig,
					})
					logger.debug('FileDataRepositoryImpl', 'Settings saved to file system')
				} catch (error) {
					logger.error('FileDataRepositoryImpl', 'Failed to save settings to file system', error)
					throw error
				}
			} else {
				// ブラウザ環境 → localStorage に保存
				try {
					localStorage.setItem(SETTINGS_FILE, JSON.stringify(settings, null, 2))
					logger.debug('FileDataRepositoryImpl', 'Settings saved to localStorage')
				} catch (error) {
					logger.error('FileDataRepositoryImpl', 'Failed to save settings to localStorage', error)
					throw error
				}
			}
		} catch (error) {
			logger.error('FileDataRepositoryImpl', 'Failed to save settings', error)
			throw error
		}
	}
}
