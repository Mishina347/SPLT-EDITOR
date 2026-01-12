import { SettingsRepository } from '../../domain/repositories/SettingsRepository'
import { BrowserSettingsRepository } from '../repositories/BrowserSettingsRepository'
import { PWASettingsRepository } from '../repositories/PWASettingsRepository'
import { TauriSettingsRepository } from '../repositories/TauriSettingsRepository'
import { isTauri, isPWA } from '../../utils'
import { logger } from '../../utils/logger'

/**
 * SettingsRepositoryのファクトリークラス
 * 環境に応じて適切なリポジトリ実装を返す
 * クリーンアーキテクチャの依存性逆転の原則を実現
 */
export class SettingsRepositoryFactory {
	private static instance: SettingsRepository | null = null

	/**
	 * 環境に応じた適切なSettingsRepositoryを取得
	 * シングルトンパターンで1つのインスタンスを使い回す
	 */
	static getInstance(): SettingsRepository {
		if (this.instance) {
			logger.debug('SettingsRepositoryFactory', 'Returning existing repository instance')
			return this.instance
		}

		// 環境判定は起動時に一度だけ行う
		if (isTauri()) {
			logger.info('SettingsRepositoryFactory', '*** Creating TauriSettingsRepository for Tauri environment ***')
			this.instance = new TauriSettingsRepository()
		} else if (isPWA()) {
			logger.info('SettingsRepositoryFactory', '*** Creating PWASettingsRepository for PWA environment ***')
			this.instance = new PWASettingsRepository()
		} else {
			logger.info('SettingsRepositoryFactory', '*** Creating BrowserSettingsRepository for Browser environment ***')
			this.instance = new BrowserSettingsRepository()
		}

		return this.instance
	}

	/**
	 * テスト用: インスタンスをリセット
	 */
	static resetInstance(): void {
		this.instance = null
	}
}
