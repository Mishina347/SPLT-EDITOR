import { EditorSettings } from '../domain'
import { FileDataRepository } from './FileDataRepository'
import { logger } from '../utils/logger'

export class FileDataRepositoryImpl implements FileDataRepository {
	async load(): Promise<EditorSettings | null> {
		try {
			// 実際の実装は既存のロジックを使用
			logger.debug('FileDataRepositoryImpl', 'Loading file data')
			// ここに実際のロードロジックを実装
			return null
		} catch (error) {
			logger.error('FileDataRepositoryImpl', 'Failed to load file data', error)
			return null
		}
	}

	async save(settings: EditorSettings): Promise<void> {
		try {
			logger.debug('FileDataRepositoryImpl', 'Saving file data', settings)
			// ここに実際のセーブロジックを実装
		} catch (error) {
			logger.error('FileDataRepositoryImpl', 'Failed to save file data', error)
			throw error
		}
	}
}
