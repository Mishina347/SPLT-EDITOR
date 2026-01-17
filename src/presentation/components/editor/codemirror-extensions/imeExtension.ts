import { Extension, StateField, StateEffect } from '@codemirror/state'
import { EditorView, ViewPlugin, Decoration, ViewUpdate } from '@codemirror/view'

interface IMEExtensionOptions {
	onCompositionStart?: () => void
	onCompositionUpdate?: (text: string) => void
	onCompositionEnd?: (text: string) => void
}

// IME入力範囲を更新するエフェクト
const setIMECompositionRange = StateEffect.define<{ from: number; to: number } | null>()

// IME入力中のデコレーション範囲を管理するStateField
const imeCompositionField = StateField.define({
	create() {
		return Decoration.none
	},
	update(value: any, tr) {
		// エフェクトで範囲が設定された場合
		for (const effect of tr.effects) {
			if (effect.is(setIMECompositionRange)) {
				if (effect.value) {
					// 太字デコレーションを作成
					const decoration = Decoration.mark({
						class: 'cm-ime-composing',
						attributes: {
							style: 'font-weight: bold;',
						},
					}).range(effect.value.from, effect.value.to)
					return Decoration.set([decoration])
				} else {
					// nullの場合はデコレーションを削除
					return Decoration.none
				}
			}
		}
		// ドキュメントが変更された場合はデコレーションを更新
		if (value.size > 0 && tr.docChanged) {
			return value.map(tr.changes)
		}
		return value
	},
	provide: f => EditorView.decorations.from(f),
})

/**
 * IME入力対応の拡張機能
 * CodeMirror 6でIME入力イベントのコールバックを提供
 * IME入力中の未確定文字を太字で表示
 * テキスト入力はCodeMirrorのデフォルト動作に準拠
 */
export function imeExtension(options: IMEExtensionOptions = {}): Extension {
	const { onCompositionStart, onCompositionUpdate, onCompositionEnd } = options

	return [
		// IME入力範囲のデコレーション管理
		imeCompositionField,
		// テーマで太字スタイルを定義
		EditorView.theme({
			'.cm-ime-composing': {
				fontWeight: 'bold',
			},
		}),
		// IME入力イベントのコールバック
		ViewPlugin.define((view: EditorView) => {
			let isComposing = false
			let compositionStartPos: number | null = null

			const handleCompositionStart = (e: CompositionEvent) => {
				isComposing = true
				compositionStartPos = view.state.selection.main.head
				onCompositionStart?.()
			}

			const handleCompositionUpdate = (e: CompositionEvent) => {
				if (isComposing) {
					const compositionText = e.data || ''
					onCompositionUpdate?.(compositionText)
				}
			}

			const handleCompositionEnd = (e: CompositionEvent) => {
				if (isComposing) {
					const finalText = e.data || ''
					view.dispatch({
						effects: setIMECompositionRange.of(null),
					})
					isComposing = false
					compositionStartPos = null
					onCompositionEnd?.(finalText)
				}
			}

			const updateIMEComposition = (update: ViewUpdate) => {
				if (isComposing && compositionStartPos !== null) {
					const currentPos = update.state.selection.main.head
					const from = compositionStartPos
					const to = currentPos

					if (from < to && from >= 0 && to <= update.state.doc.length) {
						view.dispatch({
							effects: setIMECompositionRange.of({ from, to }),
						})
					}
				}
			}

			const dom = view.dom
			dom.addEventListener('compositionstart', handleCompositionStart, true)
			dom.addEventListener('compositionupdate', handleCompositionUpdate, true)
			dom.addEventListener('compositionend', handleCompositionEnd, true)

			return {
				update: updateIMEComposition,
				destroy() {
					dom.removeEventListener('compositionstart', handleCompositionStart, true)
					dom.removeEventListener('compositionupdate', handleCompositionUpdate, true)
					dom.removeEventListener('compositionend', handleCompositionEnd, true)
				},
			}
		}),
	]
}
