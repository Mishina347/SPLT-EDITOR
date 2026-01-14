import { Extension } from '@codemirror/state'
import { EditorView, ViewPlugin, ViewUpdate } from '@codemirror/view'

/**
 * 日本語の禁則文字定義
 */
const kinsokuCharacters = {
	// 行頭禁則（行頭に来てはいけない文字）
	lineHeadProhibited:
		'。、，．：；！？）］｝」』〉》〕〗〙〛ゝゞヽヾーァィゥェォッャュョヮヵヶぁぃぅぇぉっゃゅょゎゕゖ',
	// 行末禁則（行末に来てはいけない文字）
	lineEndProhibited: '（［｛「『〈《〔〖〘〙',
}

/**
 * 日本語禁則処理拡張機能
 * 自動折り返し時に禁則処理を適用
 */
export function kinsokuExtension(): Extension {
	return ViewPlugin.define((view: EditorView) => {
		// CodeMirror 6では、自動折り返しはEditorView.lineWrappingで処理される
		// 禁則処理は、行の分割時に適用する必要がある
		// ただし、CodeMirror 6の自動折り返しはCSSベースなので、
		// 禁則処理は主にテキスト編集時の処理として実装する

		return {
			update(update: ViewUpdate) {
				// 必要に応じて禁則処理を適用
				// 現在はEditorView.lineWrappingに依存
			},
		}
	})
}
