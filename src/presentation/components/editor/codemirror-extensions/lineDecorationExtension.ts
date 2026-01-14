import { Extension } from '@codemirror/state'
import { EditorView, Decoration, ViewPlugin, ViewUpdate } from '@codemirror/view'
import { StateField, StateEffect } from '@codemirror/state'

/**
 * 行デコレーション拡張機能
 * 各行の下に半透明な線を描画
 */
export function lineDecorationExtension(textColor: string, enabled: boolean): Extension {
	if (!enabled) return []

	// 透明度を計算（16進数で約20%）
	const alpha = '33'
	const transparentColor =
		textColor.length === 7 ? textColor + alpha : textColor.replace(/rgb\(([^)]+)\)/, 'rgba($1, 0.2)')

	// 行デコレーションのエフェクト
	const addLineDecoration = StateEffect.define()

	// 行デコレーションのフィールド
	const lineDecorationField = StateField.define({
		create(state) {
			// すべての行にデコレーションを追加
			const decorations: any[] = []
			for (let i = 1; i <= state.doc.lines; i++) {
				const line = state.doc.line(i)
				decorations.push(
					Decoration.line({
						class: 'cm-line-decoration',
						attributes: {
							style: `border-bottom: 1px solid ${transparentColor};`,
						},
					}).range(line.from)
				)
			}
			return Decoration.set(decorations)
		},
		update(decorations, tr) {
			decorations = decorations.map(tr.changes)
			if (tr.docChanged) {
				// すべての行にデコレーションを追加
				const newDecorations: any[] = []
				for (let i = 1; i <= tr.newDoc.lines; i++) {
					const line = tr.newDoc.line(i)
					newDecorations.push(
						Decoration.line({
							class: 'cm-line-decoration',
							attributes: {
								style: `border-bottom: 1px solid ${transparentColor};`,
							},
						}).range(line.from)
					)
				}
				return Decoration.set(newDecorations)
			}
			return decorations
		},
		provide: f => EditorView.decorations.from(f),
	})

	// テーマでスタイルを定義
	const theme = EditorView.theme({
		'.cm-line-decoration': {
			borderBottom: `1px solid ${transparentColor}`,
		},
	})

	return [lineDecorationField, theme]
}
