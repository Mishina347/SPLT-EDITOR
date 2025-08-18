/**
 * パフォーマンス最適化のためのユーティリティ
 */

// --------------------------------------------------------
// スケジューリング関連
// --------------------------------------------------------

/**
 * requestAnimationFrameベースのスケジューラー
 */
export class TaskScheduler {
	private static instance: TaskScheduler
	private pendingTasks: Map<string, () => void> = new Map()
	private isScheduled = false

	static getInstance(): TaskScheduler {
		if (!TaskScheduler.instance) {
			TaskScheduler.instance = new TaskScheduler()
		}
		return TaskScheduler.instance
	}

	/**
	 * タスクをスケジュールする（重複実行を防ぐ）
	 */
	schedule(taskId: string, task: () => void): void {
		this.pendingTasks.set(taskId, task)

		if (!this.isScheduled) {
			this.isScheduled = true
			requestAnimationFrame(() => {
				this.flush()
			})
		}
	}

	/**
	 * 保留中のタスクをすべて実行
	 */
	private flush(): void {
		for (const task of this.pendingTasks.values()) {
			try {
				task()
			} catch (error) {
				console.error('Task execution failed:', error)
			}
		}
		this.pendingTasks.clear()
		this.isScheduled = false
	}

	/**
	 * 特定のタスクをキャンセル
	 */
	cancel(taskId: string): void {
		this.pendingTasks.delete(taskId)
	}
}

// --------------------------------------------------------
// DOM操作最適化
// --------------------------------------------------------

/**
 * DOM操作のバッチ処理
 */
export class DOMBatcher {
	private static instance: DOMBatcher
	private mutations: (() => void)[] = []
	private scheduled = false

	static getInstance(): DOMBatcher {
		if (!DOMBatcher.instance) {
			DOMBatcher.instance = new DOMBatcher()
		}
		return DOMBatcher.instance
	}

	/**
	 * DOM操作をバッチに追加
	 */
	batch(mutation: () => void): void {
		this.mutations.push(mutation)

		if (!this.scheduled) {
			this.scheduled = true
			requestAnimationFrame(() => {
				this.flush()
			})
		}
	}

	/**
	 * バッチ処理を実行
	 */
	private flush(): void {
		if (this.mutations.length === 0) {
			this.scheduled = false
			return
		}

		// 読み取り操作と書き込み操作を分離
		const reads: (() => void)[] = []
		const writes: (() => void)[] = []

		this.mutations.forEach(mutation => {
			// 簡単な判定（実際のプロジェクトではより詳細な分析が必要）
			const mutationStr = mutation.toString()
			if (mutationStr.includes('.style') || mutationStr.includes('.className')) {
				writes.push(mutation)
			} else {
				reads.push(mutation)
			}
		})

		// 読み取り → 書き込みの順で実行
		reads.forEach(read => read())
		writes.forEach(write => write())

		this.mutations = []
		this.scheduled = false
	}
}

// --------------------------------------------------------
// レンダリング最適化
// --------------------------------------------------------

/**
 * 仮想化リスト用のアイテム計算
 */
export interface VirtualizationConfig {
	itemHeight: number
	containerHeight: number
	overscan?: number
}

export interface VirtualizationResult {
	startIndex: number
	endIndex: number
	totalHeight: number
	offsetY: number
}

export const calculateVirtualization = (
	scrollTop: number,
	itemCount: number,
	config: VirtualizationConfig
): VirtualizationResult => {
	const { itemHeight, containerHeight, overscan = 3 } = config

	const startIndex = Math.max(0, Math.floor(scrollTop / itemHeight) - overscan)
	const visibleItemCount = Math.ceil(containerHeight / itemHeight)
	const endIndex = Math.min(itemCount - 1, startIndex + visibleItemCount + overscan * 2)

	return {
		startIndex,
		endIndex,
		totalHeight: itemCount * itemHeight,
		offsetY: startIndex * itemHeight,
	}
}

// --------------------------------------------------------
// 計算最適化
// --------------------------------------------------------

/**
 * 重い計算のメモ化キャッシュ
 */
export class ComputationCache<T, R> {
	private cache = new Map<string, { result: R; timestamp: number }>()
	private ttl: number

	constructor(ttlMs: number = 30000) {
		this.ttl = ttlMs
	}

	/**
	 * キャッシュから取得または計算実行
	 */
	compute(key: string, input: T, computeFn: (input: T) => R): R {
		const cached = this.cache.get(key)
		const now = Date.now()

		// キャッシュが有効な場合は返す
		if (cached && now - cached.timestamp < this.ttl) {
			return cached.result
		}

		// 計算実行
		const result = computeFn(input)
		this.cache.set(key, { result, timestamp: now })

		// 古いキャッシュをクリーンアップ
		this.cleanup(now)

		return result
	}

	/**
	 * 期限切れキャッシュの削除
	 */
	private cleanup(now: number): void {
		for (const [key, cached] of this.cache.entries()) {
			if (now - cached.timestamp >= this.ttl) {
				this.cache.delete(key)
			}
		}
	}

	/**
	 * キャッシュクリア
	 */
	clear(): void {
		this.cache.clear()
	}
}

// --------------------------------------------------------
// 文字列最適化
// --------------------------------------------------------

/**
 * 大きなテキストの効率的な処理
 */
export class TextProcessor {
	private static chunkSize = 10000 // 10KB chunks

	/**
	 * テキストを非同期でチャンク処理
	 */
	static async processTextInChunks<T>(
		text: string,
		processor: (chunk: string, index: number) => T,
		onProgress?: (progress: number) => void
	): Promise<T[]> {
		const chunks: string[] = []
		for (let i = 0; i < text.length; i += this.chunkSize) {
			chunks.push(text.slice(i, i + this.chunkSize))
		}

		const results: T[] = []

		for (let i = 0; i < chunks.length; i++) {
			// 非ブロッキング処理
			await new Promise(resolve => setTimeout(resolve, 0))

			results.push(processor(chunks[i], i))

			// 進捗通知
			if (onProgress) {
				onProgress((i + 1) / chunks.length)
			}
		}

		return results
	}

	/**
	 * 文字数カウントの最適化版
	 */
	static countCharactersOptimized(text: string): {
		characters: number
		lines: number
		words: number
	} {
		if (!text) {
			return { characters: 0, lines: 0, words: 0 }
		}

		const characters = text.length
		const lines = (text.match(/\n/g) || []).length + 1

		// 日本語文字を考慮した単語カウント
		const words = text
			.replace(/\s+/g, ' ')
			.split('')
			.filter(char => {
				const code = char.charCodeAt(0)
				// ひらがな、カタカナ、漢字、英数字
				return (
					(code >= 0x3040 && code <= 0x309f) || // ひらがな
					(code >= 0x30a0 && code <= 0x30ff) || // カタカナ
					(code >= 0x4e00 && code <= 0x9faf) || // 漢字
					(code >= 0x0041 && code <= 0x005a) || // 英大文字
					(code >= 0x0061 && code <= 0x007a) || // 英小文字
					(code >= 0x0030 && code <= 0x0039) // 数字
				)
			}).length

		return { characters, lines, words }
	}
}

// --------------------------------------------------------
// イベント最適化
// --------------------------------------------------------

/**
 * スロットリング機能付きイベントハンドラ
 */
export const createThrottledHandler = <T extends unknown[]>(
	handler: (...args: T) => void,
	delay: number
): ((...args: T) => void) => {
	let lastCall = 0
	let timeoutId: NodeJS.Timeout | null = null

	return (...args: T) => {
		const now = Date.now()

		if (now - lastCall >= delay) {
			lastCall = now
			handler(...args)
		} else {
			if (timeoutId) {
				clearTimeout(timeoutId)
			}
			timeoutId = setTimeout(
				() => {
					lastCall = Date.now()
					handler(...args)
				},
				delay - (now - lastCall)
			)
		}
	}
}

/**
 * デバウンス機能付きイベントハンドラ
 */
export const createDebouncedHandler = <T extends unknown[]>(
	handler: (...args: T) => void,
	delay: number
): ((...args: T) => void) => {
	let timeoutId: NodeJS.Timeout | null = null

	return (...args: T) => {
		if (timeoutId) {
			clearTimeout(timeoutId)
		}
		timeoutId = setTimeout(() => {
			handler(...args)
		}, delay)
	}
}

// シングルトンインスタンス
export const taskScheduler = TaskScheduler.getInstance()
export const domBatcher = DOMBatcher.getInstance()
