import { logger } from '@/utils/logger'
import { container } from '../di/Container'
import { FileDataRepositoryImpl } from '../../adapters/FileDataRepositoryImpl'
import { FilesystemNoteRepository } from '../../adapters/filesystem/FilesystemNoteRepository'
import { PaginationService } from '../PaginationService'
import { DiffDisplayService } from '../../application/diff/DiffDisplayService'
import { MonacoEditorService } from '../../application/editor/MonacoEditorService'

// サービスファクトリー
export class ServiceFactory {
	private static instance: ServiceFactory

	private constructor() {
		this.registerServices()
	}

	static getInstance(): ServiceFactory {
		if (!ServiceFactory.instance) {
			ServiceFactory.instance = new ServiceFactory()
		}
		return ServiceFactory.instance
	}

	// サービスの登録
	private registerServices(): void {
		logger.debug('ServiceFactory', 'Registering services')

		// リポジトリの登録
		container.registerSingleton('FileDataRepository', () => new FileDataRepositoryImpl())
		container.registerSingleton('NoteRepository', () => new FilesystemNoteRepository())

		// サービスの登録
		container.registerSingleton('PaginationService', () => new PaginationService())
		container.registerSingleton('DiffDisplayService', () => new DiffDisplayService())
		container.registerSingleton('MonacoEditorService', () => new MonacoEditorService())

		logger.debug('ServiceFactory', 'Services registered successfully')
	}

	// ファイルデータリポジトリの取得
	getFileDataRepository(): FileDataRepositoryImpl {
		return container.resolve<FileDataRepositoryImpl>('FileDataRepository')
	}

	// ノートリポジトリの取得
	getNoteRepository(): FilesystemNoteRepository {
		return container.resolve<FilesystemNoteRepository>('NoteRepository')
	}

	// ページネーションサービスの取得
	getPaginationService(): PaginationService {
		return container.resolve<PaginationService>('PaginationService')
	}

	// 差分表示サービスの取得
	getDiffDisplayService(): DiffDisplayService {
		return container.resolve<DiffDisplayService>('DiffDisplayService')
	}

	// Monacoエディタサービスの取得
	getMonacoEditorService(): MonacoEditorService {
		return container.resolve<MonacoEditorService>('MonacoEditorService')
	}

	// すべてのサービスを再初期化
	reinitialize(): void {
		logger.debug('ServiceFactory', 'Reinitializing all services')
		container.clear()
		this.registerServices()
	}
}

// グローバルファクトリーインスタンス
export const serviceFactory = ServiceFactory.getInstance()
