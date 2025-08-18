import { html as diff2html, parse as diffParse } from 'diff2html'
import { Diff2HtmlAdapter } from '../../infra'

export interface DiffOptions {
	drawFileList?: boolean
	matching?: 'lines' | 'words'
	outputFormat?: 'line-by-line' | 'side-by-side'
}

export class DiffDisplayService {
	private diffAdapter: Diff2HtmlAdapter

	constructor() {
		this.diffAdapter = new Diff2HtmlAdapter()
	}

	/**
	 * 2つのテキスト間の差分を計算してHTMLとして返す
	 */
	generateDiffHtml(
		oldText: string,
		newText: string,
		oldLabel: string = 'previous',
		newLabel: string = 'current',
		options: DiffOptions = {}
	): string {
		const defaultOptions: DiffOptions = {
			drawFileList: false,
			matching: 'lines',
			outputFormat: 'line-by-line',
		}

		const mergedOptions = { ...defaultOptions, ...options }

		try {
			const unifiedDiff = this.diffAdapter.generateUnifiedDiff(oldLabel, newLabel, oldText, newText)

			const diffJson = diffParse(unifiedDiff)

			return diff2html(diffJson, {
				drawFileList: mergedOptions.drawFileList,
				matching: mergedOptions.matching,
				outputFormat: mergedOptions.outputFormat,
			})
		} catch (error) {
			console.error('Error generating diff HTML:', error)
			return '<div class="diff-error">差分の生成に失敗しました</div>'
		}
	}

	/**
	 * RightPane用の差分HTML生成（特定の設定を使用）
	 */
	generateRightPaneDiff(oldText: string, newText: string): string {
		return this.generateDiffHtml(oldText, newText, 'previous', 'current', {
			drawFileList: false,
			matching: 'lines',
			outputFormat: 'line-by-line',
		})
	}

	/**
	 * 履歴比較用の差分HTML生成（サイドバイサイド表示）
	 */
	generateHistoryDiff(oldText: string, newText: string): string {
		return this.generateDiffHtml(oldText, newText, 'previous', 'current', {
			drawFileList: false,
			matching: 'lines',
			outputFormat: 'side-by-side',
		})
	}

	/**
	 * 差分HTMLが生成された後のDOM調整（line numberのposition修正など）
	 */
	adjustDiffDisplay(container: HTMLElement): void {
		// 少し遅延を入れてDOMの更新を待つ
		setTimeout(() => {
			const lineNumbers = container.querySelectorAll('.d2h-code-side-linenumber')
			lineNumbers.forEach(lineNumber => {
				if (lineNumber instanceof HTMLElement) {
					lineNumber.style.position = 'relative'
					lineNumber.style.left = 'auto'
					lineNumber.style.top = 'auto'
					lineNumber.style.right = 'auto'
					lineNumber.style.bottom = 'auto'
				}
			})
		}, 100)
	}

	/**
	 * 差分の統計情報を取得
	 */
	getDiffStats(
		oldText: string,
		newText: string
	): {
		additions: number
		deletions: number
		changes: number
	} {
		try {
			const unifiedDiff = this.diffAdapter.generateUnifiedDiff('old', 'new', oldText, newText)

			const lines = unifiedDiff.split('\n')
			let additions = 0
			let deletions = 0
			let changes = 0

			lines.forEach(line => {
				if (line.startsWith('+') && !line.startsWith('+++')) {
					additions++
				} else if (line.startsWith('-') && !line.startsWith('---')) {
					deletions++
				}
			})

			changes = Math.max(additions, deletions)

			return { additions, deletions, changes }
		} catch (error) {
			console.error('Error calculating diff stats:', error)
			return { additions: 0, deletions: 0, changes: 0 }
		}
	}
}

// シングルトンインスタンスとしてエクスポート
export const diffDisplayService = new DiffDisplayService()
