import { Extension } from '@codemirror/state'
import { EditorView, ViewPlugin, ViewUpdate } from '@codemirror/view'
import { wordCounter } from '@/utils/wordCounter'

export type SelectionCharCount = {
	selectedText: string
	characterCount: number
	lineCount: number
	pageCount: number
}

interface SelectionCountOptions {
	onSelectionChange?: (count: SelectionCharCount) => void
	wordWrapColumn: number
}

/**
 * 選択範囲カウント拡張機能
 * 選択テキストの文字数、行数、ページ数を計算して通知
 */
export function selectionCountExtension(options: SelectionCountOptions): Extension {
	const { onSelectionChange, wordWrapColumn } = options

	return ViewPlugin.define((view: EditorView) => {
		const updateSelectionCount = (update: ViewUpdate) => {
			if (!onSelectionChange) return

			const selection = update.state.selection.main
			const selectedText = update.state.sliceDoc(selection.from, selection.to)
			const lines = selectedText.split('\n')
			const { characterCount, lineCount, pageCount } = wordCounter(selectedText)

			onSelectionChange({
				selectedText,
				characterCount,
				lineCount,
				pageCount: Math.ceil(characterCount / (wordWrapColumn || 40)),
			})
		}

		return {
			update(update) {
				if (update.selectionSet || update.docChanged) {
					updateSelectionCount(update)
				}
			},
		}
	})
}
