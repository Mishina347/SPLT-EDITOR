import { StorageRepository } from '../../domain/storage/StorageRepository'
import { logger } from '../../utils/logger'

const DB_NAME = 'SPLT_EDITOR_DB'
const DB_VERSION = 1
const STORE_NAME = 'settings'

/**
 * IndexedDBを使用したストレージリポジトリの実装
 */
export class IndexedDBStorageRepository implements StorageRepository {
	private db: IDBDatabase | null = null
	private initPromise: Promise<void> | null = null

	/**
	 * ストレージの初期化
	 */
	private async init(): Promise<void> {
		if (this.db) return

		if (this.initPromise) {
			return this.initPromise
		}

		this.initPromise = new Promise((resolve, reject) => {
			const request = indexedDB.open(DB_NAME, DB_VERSION)

			request.onerror = () => {
				logger.error('IndexedDBStorageRepository', 'Failed to open database', request.error)
				reject(request.error)
			}

			request.onsuccess = () => {
				this.db = request.result
				logger.debug('IndexedDBStorageRepository', 'Database opened successfully')
				resolve()
			}

			request.onupgradeneeded = event => {
				const db = (event.target as IDBOpenDBRequest).result
				if (!db.objectStoreNames.contains(STORE_NAME)) {
					db.createObjectStore(STORE_NAME, { keyPath: 'key' })
					logger.debug('IndexedDBStorageRepository', 'Object store created')
				}
			}
		})

		return this.initPromise
	}

	async save(key: string, value: any): Promise<void> {
		try {
			await this.init()
			if (!this.db) throw new Error('Database not initialized')

			return new Promise((resolve, reject) => {
				const transaction = this.db!.transaction([STORE_NAME], 'readwrite')
				const store = transaction.objectStore(STORE_NAME)
				const request = store.put({ key, value })

				request.onerror = () => {
					logger.error('IndexedDBStorageRepository', 'Failed to save item', request.error)
					reject(request.error)
				}

				request.onsuccess = () => {
					logger.debug('IndexedDBStorageRepository', 'Item saved successfully', { key })
					resolve()
				}
			})
		} catch (error) {
			logger.error('IndexedDBStorageRepository', 'Failed to save item', error)
			throw error
		}
	}

	async load(key: string): Promise<any> {
		try {
			await this.init()
			if (!this.db) throw new Error('Database not initialized')

			return new Promise((resolve, reject) => {
				const transaction = this.db!.transaction([STORE_NAME], 'readonly')
				const store = transaction.objectStore(STORE_NAME)
				const request = store.get(key)

				request.onerror = () => {
					logger.error('IndexedDBStorageRepository', 'Failed to load item', request.error)
					reject(request.error)
				}

				request.onsuccess = () => {
					const result = request.result
					resolve(result ? result.value : null)
				}
			})
		} catch (error) {
			logger.error('IndexedDBStorageRepository', 'Failed to load item', error)
			throw error
		}
	}

	async remove(key: string): Promise<void> {
		try {
			await this.init()
			if (!this.db) throw new Error('Database not initialized')

			return new Promise((resolve, reject) => {
				const transaction = this.db!.transaction([STORE_NAME], 'readwrite')
				const store = transaction.objectStore(STORE_NAME)
				const request = store.delete(key)

				request.onerror = () => {
					logger.error('IndexedDBStorageRepository', 'Failed to remove item', request.error)
					reject(request.error)
				}

				request.onsuccess = () => {
					logger.debug('IndexedDBStorageRepository', 'Item removed successfully', { key })
					resolve()
				}
			})
		} catch (error) {
			logger.error('IndexedDBStorageRepository', 'Failed to remove item', error)
			throw error
		}
	}

	async clear(): Promise<void> {
		try {
			await this.init()
			if (!this.db) throw new Error('Database not initialized')

			return new Promise((resolve, reject) => {
				const transaction = this.db!.transaction([STORE_NAME], 'readwrite')
				const store = transaction.objectStore(STORE_NAME)
				const request = store.clear()

				request.onerror = () => {
					logger.error('IndexedDBStorageRepository', 'Failed to clear store', request.error)
					reject(request.error)
				}

				request.onsuccess = () => {
					logger.debug('IndexedDBStorageRepository', 'Store cleared successfully')
					resolve()
				}
			})
		} catch (error) {
			logger.error('IndexedDBStorageRepository', 'Failed to clear store', error)
			throw error
		}
	}

	isAvailable(): boolean {
		return typeof indexedDB !== 'undefined'
	}
}
