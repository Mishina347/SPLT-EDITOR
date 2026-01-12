import {
	SettingsStorageRepository,
	ThemeStorageRepository,
} from '../../domain/storage/StorageRepository'
import { IndexedDBStorageRepository } from './IndexedDBStorageRepository'
import { LocalStorageRepository } from './LocalStorageRepository'
import { logger } from '../../utils/logger'

const SETTINGS_KEY = 'settings.json'
const THEME_KEY = 'theme_settings'

/**
 * PWA環境用の複合ストレージリポジトリ
 * localStorage と IndexedDB の両方をサポートし、フォールバック機能を提供
 */
export class PWAStorageRepository implements SettingsStorageRepository, ThemeStorageRepository {
	private localStorageRepo: LocalStorageRepository
	private indexedDBRepo: IndexedDBStorageRepository
	private isInitialized = false
	private initializationPromise: Promise<void> | null = null

	constructor() {
		this.localStorageRepo = new LocalStorageRepository()
		this.indexedDBRepo = new IndexedDBStorageRepository()
	}

	/**
	 * ストレージの初期化
	 */
	private async initialize(): Promise<void> {
		if (this.isInitialized) return

		if (this.initializationPromise) {
			return this.initializationPromise
		}

		this.initializationPromise = this._initialize()
		return this.initializationPromise
	}

	private async _initialize(): Promise<void> {
		try {
			logger.info('PWAStorageRepository', 'Initializing PWA storage...')

			// IndexedDB の利用可能性をチェック
			if (this.indexedDBRepo.isAvailable()) {
				logger.info('PWAStorageRepository', 'IndexedDB is available')

				// IndexedDB の接続テスト
				try {
					await this.indexedDBRepo.load('__test__')
					logger.info('PWAStorageRepository', 'IndexedDB connection test successful')
				} catch (error) {
					logger.warn('PWAStorageRepository', 'IndexedDB connection test failed', error)
				}
			} else {
				logger.warn('PWAStorageRepository', 'IndexedDB is not available')
			}

			// localStorage の利用可能性をチェック
			if (this.localStorageRepo.isAvailable()) {
				logger.info('PWAStorageRepository', 'localStorage is available')
			} else {
				logger.warn('PWAStorageRepository', 'localStorage is not available')
			}

			this.isInitialized = true
			logger.info('PWAStorageRepository', 'PWA storage initialization completed')
		} catch (error) {
			logger.error('PWAStorageRepository', 'Failed to initialize PWA storage', error)
			throw error
		}
	}

	async save(key: string, value: any): Promise<void> {
		await this.initialize()

		let localStorageSuccess = false
		let indexedDBSuccess = false

		// localStorage に保存
		if (this.localStorageRepo.isAvailable()) {
			try {
				await this.localStorageRepo.save(key, value)
				localStorageSuccess = true
				logger.debug('PWAStorageRepository', 'Item saved to localStorage', { key })
			} catch (error) {
				logger.warn('PWAStorageRepository', 'localStorage save failed', error)
			}
		}

		// IndexedDB に保存
		if (this.indexedDBRepo.isAvailable()) {
			try {
				await this.indexedDBRepo.save(key, value)
				indexedDBSuccess = true
				logger.debug('PWAStorageRepository', 'Item saved to IndexedDB', { key })
			} catch (error) {
				logger.warn('PWAStorageRepository', 'IndexedDB save failed', error)
			}
		}

		// 結果をチェック
		if (localStorageSuccess || indexedDBSuccess) {
			logger.info('PWAStorageRepository', 'Item saved successfully', {
				key,
				localStorage: localStorageSuccess,
				indexedDB: indexedDBSuccess,
			})
		} else {
			const error = new Error('Failed to save item to any storage method')
			logger.error('PWAStorageRepository', 'All storage methods failed', error)
			throw error
		}
	}

	async load(key: string): Promise<any> {
		await this.initialize()

		// 1. localStorage から試行
		if (this.localStorageRepo.isAvailable()) {
			try {
				const content = await this.localStorageRepo.load(key)
				if (content) {
					logger.debug('PWAStorageRepository', 'Item loaded from localStorage', { key })

					// IndexedDB にも同期
					if (this.indexedDBRepo.isAvailable()) {
						try {
							await this.indexedDBRepo.save(key, content)
							logger.debug('PWAStorageRepository', 'Item synced to IndexedDB', { key })
						} catch (error) {
							logger.warn('PWAStorageRepository', 'Failed to sync item to IndexedDB', error)
						}
					}

					return content
				}
			} catch (error) {
				logger.warn('PWAStorageRepository', 'localStorage read failed', error)
			}
		}

		// 2. IndexedDB から試行
		if (this.indexedDBRepo.isAvailable()) {
			try {
				const content = await this.indexedDBRepo.load(key)
				if (content) {
					logger.debug('PWAStorageRepository', 'Item loaded from IndexedDB', { key })

					// localStorage にも同期
					if (this.localStorageRepo.isAvailable()) {
						try {
							await this.localStorageRepo.save(key, content)
							logger.debug('PWAStorageRepository', 'Item synced to localStorage', { key })
						} catch (error) {
							logger.warn('PWAStorageRepository', 'Failed to sync item to localStorage', error)
						}
					}

					return content
				}
			} catch (error) {
				logger.warn('PWAStorageRepository', 'IndexedDB read failed', error)
			}
		}

		// 3. どちらも失敗した場合
		logger.warn('PWAStorageRepository', 'All storage methods failed', { key })
		return null
	}

	async remove(key: string): Promise<void> {
		await this.initialize()

		let localStorageSuccess = false
		let indexedDBSuccess = false

		// localStorage から削除
		if (this.localStorageRepo.isAvailable()) {
			try {
				await this.localStorageRepo.remove(key)
				localStorageSuccess = true
				logger.debug('PWAStorageRepository', 'Item removed from localStorage', { key })
			} catch (error) {
				logger.warn('PWAStorageRepository', 'localStorage remove failed', error)
			}
		}

		// IndexedDB から削除
		if (this.indexedDBRepo.isAvailable()) {
			try {
				await this.indexedDBRepo.remove(key)
				indexedDBSuccess = true
				logger.debug('PWAStorageRepository', 'Item removed from IndexedDB', { key })
			} catch (error) {
				logger.warn('PWAStorageRepository', 'IndexedDB remove failed', error)
			}
		}

		// 結果をチェック
		if (localStorageSuccess || indexedDBSuccess) {
			logger.info('PWAStorageRepository', 'Item removed successfully', {
				key,
				localStorage: localStorageSuccess,
				indexedDB: indexedDBSuccess,
			})
		} else {
			const error = new Error('Failed to remove item from any storage method')
			logger.error('PWAStorageRepository', 'All storage methods failed', error)
			throw error
		}
	}

	async clear(): Promise<void> {
		await this.initialize()

		let localStorageSuccess = false
		let indexedDBSuccess = false

		// localStorage をクリア
		if (this.localStorageRepo.isAvailable()) {
			try {
				await this.localStorageRepo.clear()
				localStorageSuccess = true
				logger.debug('PWAStorageRepository', 'localStorage cleared')
			} catch (error) {
				logger.warn('PWAStorageRepository', 'localStorage clear failed', error)
			}
		}

		// IndexedDB をクリア
		if (this.indexedDBRepo.isAvailable()) {
			try {
				await this.indexedDBRepo.clear()
				indexedDBSuccess = true
				logger.debug('PWAStorageRepository', 'IndexedDB cleared')
			} catch (error) {
				logger.warn('PWAStorageRepository', 'IndexedDB clear failed', error)
			}
		}

		// 結果をチェック
		if (localStorageSuccess || indexedDBSuccess) {
			logger.info('PWAStorageRepository', 'Storage cleared successfully', {
				localStorage: localStorageSuccess,
				indexedDB: indexedDBSuccess,
			})
		} else {
			const error = new Error('Failed to clear any storage method')
			logger.error('PWAStorageRepository', 'All storage methods failed', error)
			throw error
		}
	}

	isAvailable(): boolean {
		return this.localStorageRepo.isAvailable() || this.indexedDBRepo.isAvailable()
	}

	// SettingsStorageRepository の実装
	async saveSettings(settings: any): Promise<void> {
		await this.save(SETTINGS_KEY, settings)
	}

	async loadSettings(): Promise<any> {
		return await this.load(SETTINGS_KEY)
	}

	// ThemeStorageRepository の実装
	async saveThemeSettings(themeSettings: any): Promise<void> {
		await this.save(THEME_KEY, themeSettings)
	}

	async loadThemeSettings(): Promise<any> {
		return await this.load(THEME_KEY)
	}

	/**
	 * ストレージの状態を取得
	 */
	async getStorageStatus(): Promise<{
		localStorage: boolean
		indexedDB: boolean
		isInitialized: boolean
	}> {
		await this.initialize()

		return {
			localStorage: this.localStorageRepo.isAvailable(),
			indexedDB: this.indexedDBRepo.isAvailable(),
			isInitialized: this.isInitialized,
		}
	}
}
