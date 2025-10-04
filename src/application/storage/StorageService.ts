import { isPWA } from '@/utils'
import {
	StorageRepository,
	SettingsStorageRepository,
	ThemeStorageRepository,
} from '../../domain/storage/StorageRepository'
import { isTauri } from '../../utils/isTauri'
import { logger } from '../../utils/logger'

/**
 * ストレージサービスの抽象クラス
 * 環境に応じて適切なストレージリポジトリを選択
 */
export abstract class StorageService {
	protected abstract getStorageRepository(): StorageRepository

	async save(key: string, value: any): Promise<void> {
		const repo = this.getStorageRepository()
		if (!repo.isAvailable()) {
			throw new Error('Storage is not available')
		}
		return await repo.save(key, value)
	}

	async load(key: string): Promise<any> {
		const repo = this.getStorageRepository()
		if (!repo.isAvailable()) {
			return null
		}
		return await repo.load(key)
	}

	async remove(key: string): Promise<void> {
		const repo = this.getStorageRepository()
		if (!repo.isAvailable()) {
			throw new Error('Storage is not available')
		}
		return await repo.remove(key)
	}

	async clear(): Promise<void> {
		const repo = this.getStorageRepository()
		if (!repo.isAvailable()) {
			throw new Error('Storage is not available')
		}
		return await repo.clear()
	}

	isAvailable(): boolean {
		return this.getStorageRepository().isAvailable()
	}
}

/**
 * 設定用ストレージサービス
 */
export class SettingsStorageService extends StorageService implements SettingsStorageRepository {
	constructor(private settingsStorageRepo: SettingsStorageRepository) {
		super()
	}

	protected getStorageRepository(): StorageRepository {
		return this.settingsStorageRepo
	}

	async saveSettings(settings: any): Promise<void> {
		return await this.settingsStorageRepo.saveSettings(settings)
	}

	async loadSettings(): Promise<any> {
		return await this.settingsStorageRepo.loadSettings()
	}
}

/**
 * テーマ用ストレージサービス
 */
export class ThemeStorageService extends StorageService implements ThemeStorageRepository {
	constructor(private themeStorageRepo: ThemeStorageRepository) {
		super()
	}

	protected getStorageRepository(): StorageRepository {
		return this.themeStorageRepo
	}

	async saveThemeSettings(themeSettings: any): Promise<void> {
		return await this.themeStorageRepo.saveThemeSettings(themeSettings)
	}

	async loadThemeSettings(): Promise<any> {
		return await this.themeStorageRepo.loadThemeSettings()
	}
}

/**
 * ストレージサービスファクトリ
 * 環境に応じて適切なストレージサービスを生成
 */
export class StorageServiceFactory {
	private static instance: StorageServiceFactory

	static getInstance(): StorageServiceFactory {
		if (!StorageServiceFactory.instance) {
			StorageServiceFactory.instance = new StorageServiceFactory()
		}
		return StorageServiceFactory.instance
	}

	createSettingsStorageService(): SettingsStorageService {
		if (isTauri()) {
			// Tauri環境ではTauriStorageRepositoryを使用
			const { TauriStorageRepository } = require('../../infra/storage/TauriStorageRepository')
			const repo = new TauriStorageRepository()
			return new SettingsStorageService(repo)
		} else {
			if (isPWA()) {
				// PWA環境ではPWAStorageRepositoryを使用
				const { PWAStorageRepository } = require('../../infra/storage/PWAStorageRepository')
				const repo = new PWAStorageRepository()
				return new SettingsStorageService(repo)
			} else {
				// ブラウザ環境ではBrowserStorageRepositoryを使用
				const { BrowserStorageRepository } = require('../../infra/storage/BrowserStorageRepository')
				const repo = new BrowserStorageRepository()
				return new SettingsStorageService(repo)
			}
		}
	}

	createThemeStorageService(): ThemeStorageService {
		if (isTauri()) {
			// Tauri環境ではTauriStorageRepositoryを使用
			const { TauriStorageRepository } = require('../../infra/storage/TauriStorageRepository')
			const repo = new TauriStorageRepository()
			return new ThemeStorageService(repo)
		} else {
			// PWA環境ではPWAStorageRepositoryを使用
			const { PWAStorageRepository } = require('../../infra/storage/PWAStorageRepository')
			const repo = new PWAStorageRepository()
			return new ThemeStorageService(repo)
		}
	}
}

// シングルトンインスタンスをエクスポート
export const storageServiceFactory = StorageServiceFactory.getInstance()
