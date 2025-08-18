import { applyKinsoku, LayoutConfig } from '../domain/preview/pdf/TextContent'

export class PaginationService {
	// キャッシュ用のMap（メモリリークを防ぐためWeakMapは使用しない）
	private static cache = new Map<string, string[][]>()
	private static readonly CACHE_SIZE_LIMIT = 100 // キャッシュサイズの制限

	static paginate(text: string, config: LayoutConfig): string[][] {
		// キャッシュキーの生成
		const cacheKey = `${text.length}_${config.charsPerLine}_${config.linesPerPage}`

		// キャッシュから取得を試行
		if (this.cache.has(cacheKey)) {
			return this.cache.get(cacheKey)!
		}

		// 禁則処理を適用して行配列を作成
		const lines = applyKinsoku(text, config.charsPerLine)

		// ページごとに分割
		const pages: string[][] = []
		for (let i = 0; i < lines.length; i += config.linesPerPage) {
			pages.push(lines.slice(i, i + config.linesPerPage))
		}

		// キャッシュに保存
		this.cache.set(cacheKey, pages)

		// キャッシュサイズの制限
		if (this.cache.size > this.CACHE_SIZE_LIMIT) {
			const firstKey = this.cache.keys().next().value
			if (firstKey) {
				this.cache.delete(firstKey)
			}
		}

		return pages
	}

	// キャッシュをクリアするメソッド（必要に応じて使用）
	static clearCache(): void {
		this.cache.clear()
	}
}
