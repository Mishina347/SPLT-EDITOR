import { logger } from '@/utils/logger'

// 依存性注入コンテナ
export class Container {
	private static instance: Container
	private services: Map<string, any> = new Map()
	private factories: Map<string, () => any> = new Map()
	private singletons: Map<string, any> = new Map()

	private constructor() {}

	static getInstance(): Container {
		if (!Container.instance) {
			Container.instance = new Container()
		}
		return Container.instance
	}

	// サービスを登録
	register<T>(key: string, service: T): void {
		this.services.set(key, service)
		logger.debug('Container', `Service registered: ${key}`)
	}

	// ファクトリーを登録
	registerFactory<T>(key: string, factory: () => T): void {
		this.factories.set(key, factory)
		logger.debug('Container', `Factory registered: ${key}`)
	}

	// シングルトンを登録
	registerSingleton<T>(key: string, factory: () => T): void {
		this.factories.set(key, factory)
		logger.debug('Container', `Singleton factory registered: ${key}`)
	}

	// サービスを取得
	resolve<T>(key: string): T {
		// シングルトンの場合
		if (this.singletons.has(key)) {
			return this.singletons.get(key)
		}

		// ファクトリーの場合
		if (this.factories.has(key)) {
			const factory = this.factories.get(key)
			if (factory) {
				const instance = factory()

				// シングルトンとして登録されている場合はキャッシュ
				if (this.factories.has(key)) {
					this.singletons.set(key, instance)
				}

				return instance
			}
		}

		// 直接登録されたサービスの場合
		if (this.services.has(key)) {
			return this.services.get(key)
		}

		throw new Error(`Service not found: ${key}`)
	}

	// 依存関係を解決
	resolveDependencies<T>(constructor: new (...args: any[]) => T, dependencies: string[]): T {
		const resolvedDependencies = dependencies.map(dep => this.resolve(dep))
		return new constructor(...resolvedDependencies)
	}

	// サービスが存在するかチェック
	has(key: string): boolean {
		return this.services.has(key) || this.factories.has(key)
	}

	// すべてのサービスをクリア
	clear(): void {
		this.services.clear()
		this.factories.clear()
		this.singletons.clear()
		logger.debug('Container', 'All services cleared')
	}

	// 登録されているサービスの一覧を取得
	getRegisteredServices(): string[] {
		return Array.from(this.services.keys())
	}

	// ファクトリーの一覧を取得
	getRegisteredFactories(): string[] {
		return Array.from(this.factories.keys())
	}
}

// グローバルコンテナインスタンス
export const container = Container.getInstance()

// デコレーターパターン（簡易版）
export function Injectable() {
	return function (target: any) {
		// メタデータを追加してDI可能にする
		;(target as any).__injectable = true
	}
}

export function Inject(key: string) {
	return function (target: any, propertyKey: string | symbol, parameterIndex: number) {
		// パラメータの依存関係を記録
		if (!(target as any).__injections) {
			;(target as any).__injections = []
		}
		const injections = (target as any).__injections
		injections[parameterIndex] = key
		;(target as any).__injections = injections
	}
}
