import { DiffWorkerInput, DiffWorkerOutput } from '../../workers/diffWorker'
import { ComputationCache } from '@/utils/performanceOptimizer'

/**
 * Web Workerを使った高性能差分計算サービス
 */
export class DiffWorkerService {
	private static instance: DiffWorkerService
	private worker: Worker | null = null
	private pendingTasks = new Map<
		string,
		{ resolve: (result: DiffWorkerOutput) => void; reject: (error: Error) => void }
	>()
	private cache = new ComputationCache<{ oldText: string; newText: string }, DiffWorkerOutput>(
		300000
	) // 5分キャッシュ
	private taskCounter = 0

	static getInstance(): DiffWorkerService {
		if (!DiffWorkerService.instance) {
			DiffWorkerService.instance = new DiffWorkerService()
		}
		return DiffWorkerService.instance
	}

	/**
	 * Workerの初期化
	 */
	private initWorker(): void {
		if (this.worker) return

		try {
			// Web Workerを作成（インライン）
			const workerBlob = new Blob([this.getWorkerScript()], { type: 'application/javascript' })
			this.worker = new Worker(URL.createObjectURL(workerBlob))

			this.worker.addEventListener('message', (event: MessageEvent<DiffWorkerOutput>) => {
				const result = event.data
				const task = this.pendingTasks.get(result.id)

				if (task) {
					this.pendingTasks.delete(result.id)
					if (result.error) {
						task.reject(new Error(result.error))
					} else {
						task.resolve(result)
					}
				}
			})

			this.worker.addEventListener('error', error => {
				console.error('Diff worker error:', error)
				// 全ての保留中タスクをエラーで終了
				for (const task of this.pendingTasks.values()) {
					task.reject(new Error('Worker error'))
				}
				this.pendingTasks.clear()
			})
		} catch (error) {
			console.warn('Web Worker not supported, falling back to main thread')
			this.worker = null
		}
	}

	/**
	 * 差分計算を実行（非同期）
	 */
	async calculateDiff(
		oldText: string,
		newText: string,
		outputFormat: 'line-by-line' | 'side-by-side' = 'line-by-line'
	): Promise<DiffWorkerOutput> {
		// キャッシュチェック
		const cacheKey = this.generateCacheKey(oldText, newText, outputFormat)

		// まず既存のキャッシュをチェック
		const existingCache = this.cache['cache'] as Map<
			string,
			{ result: DiffWorkerOutput; timestamp: number }
		>
		if (existingCache && existingCache.has(cacheKey)) {
			const cached = existingCache.get(cacheKey)
			if (cached && Date.now() - cached.timestamp < 300000) {
				// 5分間有効
				return cached.result
			}
		}

		// 小さなテキストはメインスレッドで処理
		if (oldText.length < 1000 && newText.length < 1000) {
			const result = this.calculateDiffSync(oldText, newText, outputFormat)
			// 結果をキャッシュに保存
			try {
				const cacheMap = this.cache['cache'] as Map<
					string,
					{ result: DiffWorkerOutput; timestamp: number }
				>
				if (cacheMap) {
					cacheMap.set(cacheKey, {
						result,
						timestamp: Date.now(),
					})
				}
			} catch {
				// キャッシュエラーは無視
			}
			return result
		}

		// Web Workerで処理
		if (!this.worker) {
			this.initWorker()
		}

		if (!this.worker) {
			// Workerが使用できない場合はメインスレッドで処理
			const result = this.calculateDiffSync(oldText, newText, outputFormat)
			// 結果をキャッシュに保存
			try {
				const cacheMap = this.cache['cache'] as Map<
					string,
					{ result: DiffWorkerOutput; timestamp: number }
				>
				if (cacheMap) {
					cacheMap.set(cacheKey, {
						result,
						timestamp: Date.now(),
					})
				}
			} catch {
				// キャッシュエラーは無視
			}
			return result
		}

		return new Promise<DiffWorkerOutput>((resolve, reject) => {
			const taskId = `diff_${++this.taskCounter}_${Date.now()}`

			this.pendingTasks.set(taskId, { resolve, reject })

			const input: DiffWorkerInput = {
				id: taskId,
				oldText,
				newText,
				outputFormat,
			}

			this.worker!.postMessage(input)

			// タイムアウト設定（30秒）
			setTimeout(() => {
				if (this.pendingTasks.has(taskId)) {
					this.pendingTasks.delete(taskId)
					reject(new Error('Diff calculation timeout'))
				}
			}, 30000)
		}).then(result => {
			// 結果をキャッシュに保存
			try {
				const cacheMap = this.cache['cache'] as Map<
					string,
					{ result: DiffWorkerOutput; timestamp: number }
				>
				if (cacheMap) {
					cacheMap.set(cacheKey, {
						result,
						timestamp: Date.now(),
					})
				}
			} catch {
				// キャッシュエラーは無視
			}
			return result
		})
	}

	/**
	 * 同期的な差分計算（フォールバック）
	 */
	private calculateDiffSync(
		oldText: string,
		newText: string,
		outputFormat: 'line-by-line' | 'side-by-side'
	): DiffWorkerOutput {
		try {
			// 簡易差分計算
			const stats = this.calculateSimpleStats(oldText, newText)
			const html = this.generateSimpleDiffHtml(oldText, newText, outputFormat)

			return {
				id: `sync_${Date.now()}`,
				html,
				stats,
			}
		} catch (error) {
			return {
				id: `sync_${Date.now()}`,
				html: '',
				stats: { additions: 0, deletions: 0, changes: 0 },
				error: error instanceof Error ? error.message : 'Unknown error',
			}
		}
	}

	/**
	 * 簡易統計計算
	 */
	private calculateSimpleStats(
		oldText: string,
		newText: string
	): { additions: number; deletions: number; changes: number } {
		const oldLines = oldText.split('\n')
		const newLines = newText.split('\n')

		let additions = 0
		let deletions = 0

		const maxLength = Math.max(oldLines.length, newLines.length)

		for (let i = 0; i < maxLength; i++) {
			const oldLine = oldLines[i] || ''
			const newLine = newLines[i] || ''

			if (oldLine !== newLine) {
				if (!oldLine) additions++
				else if (!newLine) deletions++
				else {
					additions++
					deletions++
				}
			}
		}

		return {
			additions,
			deletions,
			changes: Math.max(additions, deletions),
		}
	}

	/**
	 * 簡易HTML生成
	 */
	private generateSimpleDiffHtml(oldText: string, newText: string, outputFormat: string): string {
		const oldLines = oldText.split('\n')
		const newLines = newText.split('\n')
		const maxLines = Math.max(oldLines.length, newLines.length)
		const diffLines: string[] = []

		diffLines.push(`<div class="diff-container ${outputFormat}">`)

		for (let i = 0; i < maxLines; i++) {
			const oldLine = oldLines[i] || ''
			const newLine = newLines[i] || ''

			if (oldLine === newLine) {
				diffLines.push(`<div class="line unchanged">${this.escapeHtml(oldLine)}</div>`)
			} else {
				if (oldLine) {
					diffLines.push(`<div class="line deleted">- ${this.escapeHtml(oldLine)}</div>`)
				}
				if (newLine) {
					diffLines.push(`<div class="line added">+ ${this.escapeHtml(newLine)}</div>`)
				}
			}
		}

		diffLines.push('</div>')
		return diffLines.join('\n')
	}

	/**
	 * HTMLエスケープ
	 */
	private escapeHtml(text: string): string {
		return text
			.replace(/&/g, '&amp;')
			.replace(/</g, '&lt;')
			.replace(/>/g, '&gt;')
			.replace(/"/g, '&quot;')
			.replace(/'/g, '&#39;')
	}

	/**
	 * キャッシュキー生成
	 */
	private generateCacheKey(oldText: string, newText: string, outputFormat: string): string {
		const oldHash = this.simpleHash(oldText)
		const newHash = this.simpleHash(newText)
		return `${oldHash}_${newHash}_${outputFormat}`
	}

	/**
	 * 簡易ハッシュ関数
	 */
	private simpleHash(text: string): string {
		let hash = 0
		for (let i = 0; i < text.length; i++) {
			const char = text.charCodeAt(i)
			hash = (hash << 5) - hash + char
			hash = hash & hash // 32bit整数に変換
		}
		return hash.toString(36)
	}

	/**
	 * Workerスクリプトの取得（インライン実装）
	 */
	private getWorkerScript(): string {
		return `
			// 簡易差分計算Workerスクリプト
			self.addEventListener('message', function(event) {
				const { id, oldText, newText, outputFormat } = event.data;
				
				try {
					const oldLines = oldText.split('\\n');
					const newLines = newText.split('\\n');
					
					let additions = 0;
					let deletions = 0;
					const maxLength = Math.max(oldLines.length, newLines.length);
					
					for (let i = 0; i < maxLength; i++) {
						const oldLine = oldLines[i] || '';
						const newLine = newLines[i] || '';
						
						if (oldLine !== newLine) {
							if (!oldLine) additions++;
							else if (!newLine) deletions++;
							else {
								additions++;
								deletions++;
							}
						}
					}
					
					const stats = {
						additions: additions,
						deletions: deletions,
						changes: Math.max(additions, deletions)
					};
					
					// 簡易HTML生成
					const diffLines = [];
					diffLines.push('<div class="diff-container ' + outputFormat + '">');
					
					for (let i = 0; i < maxLength; i++) {
						const oldLine = oldLines[i] || '';
						const newLine = newLines[i] || '';
						
						if (oldLine === newLine) {
							diffLines.push('<div class="line unchanged">' + escapeHtml(oldLine) + '</div>');
						} else {
							if (oldLine) {
								diffLines.push('<div class="line deleted">- ' + escapeHtml(oldLine) + '</div>');
							}
							if (newLine) {
								diffLines.push('<div class="line added">+ ' + escapeHtml(newLine) + '</div>');
							}
						}
					}
					
					diffLines.push('</div>');
					const html = diffLines.join('\\n');
					
					function escapeHtml(text) {
						return text
							.replace(/&/g, '&amp;')
							.replace(/</g, '&lt;')
							.replace(/>/g, '&gt;')
							.replace(/"/g, '&quot;')
							.replace(/'/g, '&#39;');
					}
					
					self.postMessage({ id: id, html: html, stats: stats });
				} catch (error) {
					self.postMessage({ 
						id: id, 
						html: '', 
						stats: { additions: 0, deletions: 0, changes: 0 },
						error: error.message 
					});
				}
			});
		`
	}

	/**
	 * リソースの解放
	 */
	dispose(): void {
		if (this.worker) {
			this.worker.terminate()
			this.worker = null
		}
		this.pendingTasks.clear()
		this.cache.clear()
	}
}

// シングルトンインスタンス
export const diffWorkerService = DiffWorkerService.getInstance()
