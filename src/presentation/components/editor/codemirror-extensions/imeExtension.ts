import { Extension, StateEffect, StateField } from '@codemirror/state'
import { EditorView, ViewPlugin, ViewUpdate } from '@codemirror/view'

interface IMEExtensionOptions {
	onCompositionStart?: () => void
	onCompositionUpdate?: (text: string) => void
	onCompositionEnd?: (text: string) => void
}

/**
 * IME入力対応の拡張機能
 * CodeMirror 6でIME入力イベントを処理
 * IME入力中はエディタに反映させず、確定時のみ反映
 */
export function imeExtension(options: IMEExtensionOptions = {}): Extension {
	const { onCompositionStart, onCompositionUpdate, onCompositionEnd } = options

	// IME入力中フラグを管理するためのWeakMap
	const composingViews = new WeakMap<EditorView, boolean>()
	// IME入力開始時のドキュメント状態を保存
	const savedDocStates = new WeakMap<
		EditorView,
		{ doc: string; selection: { from: number; to: number } }
	>()

	return [
		// IME入力中フラグを管理するViewPlugin
		ViewPlugin.define((view: EditorView) => {
			let isComposing = false
			let compositionText = ''

			const handleCompositionStart = (e: CompositionEvent) => {
				isComposing = true
				composingViews.set(view, true)
				compositionText = ''

				// IME入力開始時のドキュメント状態を保存
				const selection = view.state.selection.main
				savedDocStates.set(view, {
					doc: view.state.doc.toString(),
					selection: { from: selection.from, to: selection.to },
				})

				onCompositionStart?.()
			}

			const handleCompositionUpdate = (e: CompositionEvent) => {
				if (isComposing) {
					compositionText = e.data || ''
					onCompositionUpdate?.(compositionText)
				}
			}

			const handleCompositionEnd = (e: CompositionEvent) => {
				if (isComposing) {
					const finalText = e.data || ''
					isComposing = false
					composingViews.set(view, false)

					// 確定したテキストを手動で挿入
					if (finalText) {
						const savedState = savedDocStates.get(view)
						if (savedState) {
							// 保存された状態に戻す
							const currentDoc = view.state.doc.toString()
							if (currentDoc !== savedState.doc) {
								// IME入力中に変更があった場合は元に戻す
								view.dispatch({
									changes: {
										from: 0,
										to: view.state.doc.length,
										insert: savedState.doc,
									},
									selection: {
										anchor: savedState.selection.from,
										head: savedState.selection.to,
									},
								})
							}

							// 確定したテキストを挿入
							view.dispatch({
								changes: {
									from: savedState.selection.from,
									to: savedState.selection.to,
									insert: finalText,
								},
								selection: {
									anchor: savedState.selection.from + finalText.length,
								},
							})
						} else {
							// 保存された状態がない場合は通常通り挿入
							const selection = view.state.selection.main
							view.dispatch({
								changes: {
									from: selection.from,
									to: selection.to,
									insert: finalText,
								},
								selection: {
									anchor: selection.from + finalText.length,
								},
							})
						}
						savedDocStates.delete(view)
					}

					compositionText = ''
					onCompositionEnd?.(finalText)
				}
			}

			// DOM要素にイベントリスナーを追加
			const dom = view.dom
			dom.addEventListener('compositionstart', handleCompositionStart, true)
			dom.addEventListener('compositionupdate', handleCompositionUpdate, true)
			dom.addEventListener('compositionend', handleCompositionEnd, true)

			return {
				destroy() {
					dom.removeEventListener('compositionstart', handleCompositionStart, true)
					dom.removeEventListener('compositionupdate', handleCompositionUpdate, true)
					dom.removeEventListener('compositionend', handleCompositionEnd, true)
					composingViews.delete(view)
					savedDocStates.delete(view)
				},
			}
		}),
		// IME入力中はbeforeinputイベントでエディタへの反映を防ぐ
		EditorView.domEventHandlers({
			beforeinput(event, view) {
				// IME入力中の場合、エディタへの反映を防ぐ
				if (composingViews.get(view)) {
					// IME関連の入力タイプをチェック
					const inputType = event.inputType
					if (
						inputType === 'insertCompositionText' ||
						inputType === 'insertText' ||
						inputType === 'insertLineBreak' ||
						inputType === 'insertParagraph' ||
						!inputType // inputTypeが未定義の場合もブロック（IME入力の可能性）
					) {
						event.preventDefault()
						return true // イベントを消費
					}
				}
				return false
			},
			input(event, view) {
				// IME入力中の場合、エディタへの反映を防ぐ
				if (composingViews.get(view)) {
					event.preventDefault()
					return true // イベントを消費
				}
				return false
			},
		}),
	]
}
