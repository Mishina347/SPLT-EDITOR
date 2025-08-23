import { LayoutConfig } from '../domain'
import { ComputationCache, TextProcessor } from '../utils/performanceOptimizer'

/**
 * 最適化されたページネーションサービス
 */
export class PaginationServiceOptimized {
	private static cache = new ComputationCache<{ text: string; config: LayoutConfig }, string[][]>(
		60000
	) // 1分キャッシュ
	private static textHashCache = new Map<string, string>()

	/**
	 * テキストのハッシュを生成（キャッシュキー用）
	 */
	private static generateTextHash(text: string, config: LayoutConfig): string {
		// フォント設定も含めてキャッシュキーを生成
		const fontSize = config.fontSize || 16
		const fontFamily = config.fontFamily || 'default'
		const configStr = `${config.charsPerLine}_${config.linesPerPage}_${fontSize}_${fontFamily}`
		const textKey = `${text.length}_${text.slice(0, 100)}_${text.slice(-100)}`
		return `${textKey}_${configStr}`
	}

	/**
	 * 高速なページネーション処理
	 */
	static paginate(text: string, config: LayoutConfig): string[][] {
		const cacheKey = this.generateTextHash(text, config)

		return this.cache.compute(cacheKey, { text, config }, ({ text, config }) =>
			this.paginateInternal(text, config)
		)
	}

	/**
	 * フォント設定変更時のキャッシュクリア
	 */
	static clearCacheForFontChange(): void {
		console.log('[PaginationServiceOptimized] Clearing cache for font change')
		this.cache.clear()
		this.textHashCache.clear()
	}

	/**
	 * 内部ページネーション処理
	 */
	private static paginateInternal(text: string, config: LayoutConfig): string[][] {
		const { charsPerLine, linesPerPage } = config

		if (!text || text.trim() === '') {
			return [['']]
		}

		// 大きなテキストの場合は分割処理
		if (text.length > 50000) {
			return this.paginateLargeText(text, config)
		}

		return this.paginateSmallText(text, config)
	}

	/**
	 * 小さなテキスト用の高速処理
	 */
	private static paginateSmallText(text: string, config: LayoutConfig): string[][] {
		const { charsPerLine, linesPerPage } = config
		const lines = text.split('\n')
		const wrappedLines: string[] = []

		// 行ラッピング処理
		for (const line of lines) {
			if (line.length <= charsPerLine) {
				wrappedLines.push(line)
			} else {
				// 長い行を分割
				for (let i = 0; i < line.length; i += charsPerLine) {
					wrappedLines.push(line.slice(i, i + charsPerLine))
				}
			}
		}

		// ページ分割
		const pages: string[][] = []
		for (let i = 0; i < wrappedLines.length; i += linesPerPage) {
			const pageLines = wrappedLines.slice(i, i + linesPerPage)
			pages.push(pageLines)
		}

		return pages.length > 0 ? pages : [['']]
	}

	/**
	 * 大きなテキスト用の非同期処理
	 */
	private static paginateLargeText(text: string, config: LayoutConfig): string[][] {
		const { charsPerLine, linesPerPage } = config
		const chunkSize = 10000 // 10KB チャンク

		// チャンク単位で処理
		const pages: string[][] = []
		let currentPage: string[] = []
		let currentLineCount = 0

		for (let i = 0; i < text.length; i += chunkSize) {
			const chunk = text.slice(i, i + chunkSize)
			const lines = chunk.split('\n')

			for (const line of lines) {
				const wrappedLines = this.wrapLine(line, charsPerLine)

				for (const wrappedLine of wrappedLines) {
					currentPage.push(wrappedLine)
					currentLineCount++

					if (currentLineCount >= linesPerPage) {
						pages.push([...currentPage])
						currentPage = []
						currentLineCount = 0
					}
				}
			}
		}

		// 残りのページを追加
		if (currentPage.length > 0) {
			pages.push(currentPage)
		}

		return pages.length > 0 ? pages : [['']]
	}

	/**
	 * 行ラッピングの最適化
	 */
	private static wrapLine(line: string, charsPerLine: number): string[] {
		if (line.length <= charsPerLine) {
			return [line]
		}

		const wrappedLines: string[] = []
		let currentPos = 0

		while (currentPos < line.length) {
			let endPos = currentPos + charsPerLine

			// 単語境界での分割を試行（日本語の場合は文字単位）
			if (endPos < line.length) {
				const nextChar = line[endPos]
				const currentChar = line[endPos - 1]

				// 英単語の途中で分割しないように調整
				if (this.isAscii(currentChar) && this.isAscii(nextChar) && nextChar !== ' ') {
					// 空白を探して後退
					let spacePos = endPos - 1
					while (spacePos > currentPos && line[spacePos] !== ' ') {
						spacePos--
					}
					if (spacePos > currentPos) {
						endPos = spacePos + 1
					}
				}
			}

			wrappedLines.push(line.slice(currentPos, endPos))
			currentPos = endPos
		}

		return wrappedLines
	}

	/**
	 * ASCII文字判定
	 */
	private static isAscii(char: string): boolean {
		return char.charCodeAt(0) < 128
	}

	/**
	 * ページ情報の取得（メタデータのみ）
	 */
	static getPageInfo(
		text: string,
		config: LayoutConfig
	): {
		totalPages: number
		totalLines: number
		estimatedPages: number
	} {
		// 概算計算（高速）
		const lines = text.split('\n')
		const estimatedWrappedLines = lines.reduce((total, line) => {
			return total + Math.ceil(line.length / config.charsPerLine) || 1
		}, 0)

		const estimatedPages = Math.ceil(estimatedWrappedLines / config.linesPerPage) || 1

		return {
			totalPages: estimatedPages,
			totalLines: estimatedWrappedLines,
			estimatedPages,
		}
	}

	/**
	 * 特定ページのみを計算（遅延読み込み用）
	 */
	static getPage(text: string, config: LayoutConfig, pageIndex: number): string[] {
		const { charsPerLine, linesPerPage } = config

		if (!text || text.trim() === '') {
			return ['']
		}

		// 全体をページネーションせずに、該当ページのみ計算
		const lines = text.split('\n')
		const wrappedLines: string[] = []

		// 行ラッピング（必要な範囲のみ）
		const startLineEstimate = pageIndex * linesPerPage
		const endLineEstimate = (pageIndex + 1) * linesPerPage

		let currentLineIndex = 0
		for (const line of lines) {
			const lineWrapped = this.wrapLine(line, charsPerLine)

			for (const wrappedLine of lineWrapped) {
				if (currentLineIndex >= startLineEstimate && currentLineIndex < endLineEstimate) {
					wrappedLines.push(wrappedLine)
				}
				currentLineIndex++

				if (currentLineIndex >= endLineEstimate) {
					break
				}
			}

			if (currentLineIndex >= endLineEstimate) {
				break
			}
		}

		return wrappedLines.slice(0, linesPerPage)
	}

	/**
	 * キャッシュクリア
	 */
	static clearCache(): void {
		this.cache.clear()
		this.textHashCache.clear()
	}

	/**
	 * 非同期ページネーション（大きなテキスト用）
	 */
	static async paginateAsync(
		text: string,
		config: LayoutConfig,
		onProgress?: (progress: number) => void
	): Promise<string[][]> {
		if (text.length < 50000) {
			return this.paginate(text, config)
		}

		const cacheKey = this.generateTextHash(text, config)

		// キャッシュチェック
		const cached = this.cache.compute(cacheKey, { text, config }, () => [])
		if (cached.length > 0) {
			return cached
		}

		// 非同期処理
		const result = await TextProcessor.processTextInChunks(
			text,
			(chunk, index) => {
				return this.paginateSmallText(chunk, config)
			},
			onProgress
		)

		// 結果をマージ
		const mergedPages = result.reduce((acc, pages) => acc.concat(pages), [])

		// キャッシュに保存
		this.cache.compute(cacheKey, { text, config }, () => mergedPages)

		return mergedPages
	}
}
