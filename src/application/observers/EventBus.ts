import { logger } from '@/utils/logger'

// イベントハンドラー型
export type EventHandler<T = any> = (data: T) => void | Promise<void>

// イベントバス
export class EventBus {
	private static instance: EventBus
	private handlers: Map<string, Set<EventHandler>> = new Map()
	private asyncHandlers: Map<string, Set<EventHandler>> = new Map()

	private constructor() {}

	static getInstance(): EventBus {
		if (!EventBus.instance) {
			EventBus.instance = new EventBus()
		}
		return EventBus.instance
	}

	// イベントを購読
	subscribe<T>(event: string, handler: EventHandler<T>): () => void {
		if (!this.handlers.has(event)) {
			this.handlers.set(event, new Set())
		}
		this.handlers.get(event)!.add(handler)

		logger.debug('EventBus', `Handler subscribed to event: ${event}`)

		// 購読解除関数を返す
		return () => {
			this.unsubscribe(event, handler)
		}
	}

	// 非同期イベントを購読
	subscribeAsync<T>(event: string, handler: EventHandler<T>): () => void {
		if (!this.asyncHandlers.has(event)) {
			this.asyncHandlers.set(event, new Set())
		}
		this.asyncHandlers.get(event)!.add(handler)

		logger.debug('EventBus', `Async handler subscribed to event: ${event}`)

		// 購読解除関数を返す
		return () => {
			this.unsubscribeAsync(event, handler)
		}
	}

	// 購読を解除
	unsubscribe<T>(event: string, handler: EventHandler<T>): void {
		const handlers = this.handlers.get(event)
		if (handlers) {
			handlers.delete(handler)
			if (handlers.size === 0) {
				this.handlers.delete(event)
			}
			logger.debug('EventBus', `Handler unsubscribed from event: ${event}`)
		}
	}

	// 非同期購読を解除
	unsubscribeAsync<T>(event: string, handler: EventHandler<T>): void {
		const handlers = this.asyncHandlers.get(event)
		if (handlers) {
			handlers.delete(handler)
			if (handlers.size === 0) {
				this.asyncHandlers.delete(event)
			}
			logger.debug('EventBus', `Async handler unsubscribed from event: ${event}`)
		}
	}

	// イベントを発行
	publish<T>(event: string, data?: T): void {
		const handlers = this.handlers.get(event)
		if (handlers) {
			handlers.forEach(handler => {
				try {
					handler(data)
				} catch (error) {
					logger.error('EventBus', `Error in event handler for ${event}`, error)
				}
			})
		}

		logger.debug('EventBus', `Event published: ${event}`, data)
	}

	// 非同期イベントを発行
	async publishAsync<T>(event: string, data?: T): Promise<void> {
		const handlers = this.asyncHandlers.get(event)
		if (handlers) {
			const promises = Array.from(handlers).map(async handler => {
				try {
					await handler(data)
				} catch (error) {
					logger.error('EventBus', `Error in async event handler for ${event}`, error)
				}
			})
			await Promise.all(promises)
		}

		logger.debug('EventBus', `Async event published: ${event}`, data)
	}

	// 一度だけ実行されるイベントを購読
	once<T>(event: string, handler: EventHandler<T>): () => void {
		const onceHandler: EventHandler<T> = (data: T) => {
			handler(data)
			this.unsubscribe(event, onceHandler)
		}
		return this.subscribe(event, onceHandler)
	}

	// 非同期で一度だけ実行されるイベントを購読
	onceAsync<T>(event: string, handler: EventHandler<T>): () => void {
		const onceHandler: EventHandler<T> = async (data: T) => {
			await handler(data)
			this.unsubscribeAsync(event, onceHandler)
		}
		return this.subscribeAsync(event, onceHandler)
	}

	// 特定のイベントの購読者数を取得
	getSubscriberCount(event: string): number {
		const syncCount = this.handlers.get(event)?.size || 0
		const asyncCount = this.asyncHandlers.get(event)?.size || 0
		return syncCount + asyncCount
	}

	// すべてのイベントをクリア
	clear(): void {
		this.handlers.clear()
		this.asyncHandlers.clear()
		logger.debug('EventBus', 'All event handlers cleared')
	}

	// 特定のイベントをクリア
	clearEvent(event: string): void {
		this.handlers.delete(event)
		this.asyncHandlers.delete(event)
		logger.debug('EventBus', `Event cleared: ${event}`)
	}

	// 登録されているイベントの一覧を取得
	getRegisteredEvents(): string[] {
		const events = new Set<string>()
		this.handlers.forEach((_, event) => events.add(event))
		this.asyncHandlers.forEach((_, event) => events.add(event))
		return Array.from(events)
	}
}

// グローバルイベントバスインスタンス
export const eventBus = EventBus.getInstance()

// イベント定数
export const EVENTS = {
	// テキスト関連
	TEXT_CHANGED: 'text:changed',
	TEXT_SAVED: 'text:saved',
	TEXT_LOADED: 'text:loaded',

	// 設定関連
	SETTINGS_CHANGED: 'settings:changed',
	SETTINGS_SAVED: 'settings:saved',
	SETTINGS_LOADED: 'settings:loaded',

	// UI関連
	TOOLBAR_TOGGLED: 'ui:toolbar:toggled',
	PREVIEW_MODE_CHANGED: 'ui:preview:mode:changed',
	EDITOR_FOCUSED: 'ui:editor:focused',
	PREVIEW_FOCUSED: 'ui:preview:focused',

	// ファイル関連
	FILE_OPENED: 'file:opened',
	FILE_SAVED: 'file:saved',
	FILE_EXPORTED: 'file:exported',

	// エラー関連
	ERROR_OCCURRED: 'error:occurred',
	WARNING_SHOWN: 'warning:shown',

	// パフォーマンス関連
	PERFORMANCE_METRIC: 'performance:metric',
	RENDER_COMPLETED: 'render:completed',
} as const

export type EventType = (typeof EVENTS)[keyof typeof EVENTS]
