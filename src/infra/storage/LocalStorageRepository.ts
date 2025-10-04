import { StorageRepository } from '../../domain/storage/StorageRepository'
import { logger } from '../../utils/logger'

/**
 * localStorageを使用したストレージリポジトリの実装
 */
export class LocalStorageRepository implements StorageRepository {
	async save(key: string, value: any): Promise<void> {
		try {
			localStorage.setItem(key, JSON.stringify(value, null, 2))
			logger.debug('LocalStorageRepository', 'Item saved successfully', { key })
		} catch (error) {
			logger.error('LocalStorageRepository', 'Failed to save item', error)
			throw error
		}
	}

	async load(key: string): Promise<any> {
		try {
			const content = localStorage.getItem(key)
			if (content) {
				const parsed = JSON.parse(content)
				logger.debug('LocalStorageRepository', 'Item loaded successfully', { key })
				return parsed
			}
			return null
		} catch (error) {
			logger.error('LocalStorageRepository', 'Failed to load item', error)
			throw error
		}
	}

	async remove(key: string): Promise<void> {
		try {
			localStorage.removeItem(key)
			logger.debug('LocalStorageRepository', 'Item removed successfully', { key })
		} catch (error) {
			logger.error('LocalStorageRepository', 'Failed to remove item', error)
			throw error
		}
	}

	async clear(): Promise<void> {
		try {
			localStorage.clear()
			logger.debug('LocalStorageRepository', 'Storage cleared successfully')
		} catch (error) {
			logger.error('LocalStorageRepository', 'Failed to clear storage', error)
			throw error
		}
	}

	isAvailable(): boolean {
		try {
			// localStorageの利用可能性をテスト
			const testKey = '__localStorage_test__'
			localStorage.setItem(testKey, 'test')
			localStorage.removeItem(testKey)
			return true
		} catch (error) {
			return false
		}
	}
}
