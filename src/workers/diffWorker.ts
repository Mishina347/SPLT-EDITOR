/**
 * 差分計算用のWeb Worker
 */

import { Diff2HtmlAdapter } from '../infra/diff/Diff2HtmlAdapter'

export interface DiffWorkerInput {
	id: string
	oldText: string
	newText: string
	oldLabel?: string
	newLabel?: string
	outputFormat?: 'line-by-line' | 'side-by-side'
}

export interface DiffWorkerOutput {
	id: string
	html: string
	stats: {
		additions: number
		deletions: number
		changes: number
	}
	error?: string
}

// Worker内でのメッセージハンドリング
self.addEventListener('message', async (event: MessageEvent<DiffWorkerInput>) => {
	const {
		id,
		oldText,
		newText,
		oldLabel = 'previous',
		newLabel = 'current',
		outputFormat = 'line-by-line',
	} = event.data

	try {
		const diffAdapter = new Diff2HtmlAdapter()

		// 差分計算
		const unifiedDiff = diffAdapter.generateUnifiedDiff(oldLabel, newLabel, oldText, newText)

		// 統計情報を計算
		const stats = calculateDiffStats(unifiedDiff)

		// HTMLの場合は差分ライブラリを使用（Workerでは制限があるため簡略化）
		const html = generateSimpleDiffHtml(oldText, newText, outputFormat)

		const result: DiffWorkerOutput = {
			id,
			html,
			stats,
		}

		self.postMessage(result)
	} catch (error) {
		const result: DiffWorkerOutput = {
			id,
			html: '',
			stats: { additions: 0, deletions: 0, changes: 0 },
			error: error instanceof Error ? error.message : 'Unknown error',
		}

		self.postMessage(result)
	}
})

/**
 * 差分統計の計算
 */
function calculateDiffStats(unifiedDiff: string): {
	additions: number
	deletions: number
	changes: number
} {
	const lines = unifiedDiff.split('\n')
	let additions = 0
	let deletions = 0

	lines.forEach(line => {
		if (line.startsWith('+') && !line.startsWith('+++')) {
			additions++
		} else if (line.startsWith('-') && !line.startsWith('---')) {
			deletions++
		}
	})

	return {
		additions,
		deletions,
		changes: Math.max(additions, deletions),
	}
}

/**
 * シンプルな差分HTML生成（Worker環境用）
 */
function generateSimpleDiffHtml(oldText: string, newText: string, outputFormat: string): string {
	const oldLines = oldText.split('\n')
	const newLines = newText.split('\n')

	// 簡単なライン比較
	const maxLines = Math.max(oldLines.length, newLines.length)
	const diffLines: string[] = []

	if (outputFormat === 'side-by-side') {
		diffLines.push('<div class="diff-container side-by-side">')
		diffLines.push('<table class="diff-table">')

		for (let i = 0; i < maxLines; i++) {
			const oldLine = oldLines[i] || ''
			const newLine = newLines[i] || ''

			let rowClass = 'unchanged'
			if (oldLine !== newLine) {
				if (!oldLine) rowClass = 'added'
				else if (!newLine) rowClass = 'deleted'
				else rowClass = 'modified'
			}

			diffLines.push(`
				<tr class="${rowClass}">
					<td class="line-number">${i + 1}</td>
					<td class="line-content old">${escapeHtml(oldLine)}</td>
					<td class="line-number">${i + 1}</td>
					<td class="line-content new">${escapeHtml(newLine)}</td>
				</tr>
			`)
		}

		diffLines.push('</table>')
		diffLines.push('</div>')
	} else {
		// line-by-line
		diffLines.push('<div class="diff-container line-by-line">')

		for (let i = 0; i < maxLines; i++) {
			const oldLine = oldLines[i] || ''
			const newLine = newLines[i] || ''

			if (oldLine === newLine) {
				diffLines.push(
					`<div class="line unchanged"><span class="line-number">${i + 1}</span><span class="content">${escapeHtml(oldLine)}</span></div>`
				)
			} else {
				if (oldLine) {
					diffLines.push(
						`<div class="line deleted"><span class="line-number">-</span><span class="content">${escapeHtml(oldLine)}</span></div>`
					)
				}
				if (newLine) {
					diffLines.push(
						`<div class="line added"><span class="line-number">+</span><span class="content">${escapeHtml(newLine)}</span></div>`
					)
				}
			}
		}

		diffLines.push('</div>')
	}

	return diffLines.join('\n')
}

/**
 * HTMLエスケープ
 */
function escapeHtml(text: string): string {
	const div = document.createElement('div')
	div.textContent = text
	return div.innerHTML
}
