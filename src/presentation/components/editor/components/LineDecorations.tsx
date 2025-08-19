import * as monaco from 'monaco-editor'
import { useCallback, useEffect, useRef } from 'react'

interface UseLineDecorationsProps {
	editorRef: React.RefObject<monaco.editor.IStandaloneCodeEditor | null>
	textColor: string
	enabled: boolean
}

export const useLineDecorations = ({ editorRef, textColor, enabled }: UseLineDecorationsProps) => {
	const styleRef = useRef<HTMLStyleElement | null>(null)

	// 各行に半透明な線を描画する関数
	const addLineDecorations = useCallback(() => {
		if (!enabled || !editorRef.current) return

		const editor = editorRef.current
		const model = editor.getModel()
		if (!model) return

		// 半透明な線のCSS
		const lineColor = textColor
		const alpha = '33' // 透明度（16進数で約20%）
		const transparentColor =
			lineColor.length === 7 ? lineColor + alpha : lineColor.replace(/rgb\(([^)]+)\)/, 'rgba($1, 0.2)')

		// CSS スタイルを動的に追加/更新
		let style = styleRef.current
		if (!style) {
			style = document.createElement('style')
			style.id = 'editor-line-decoration'
			document.head.appendChild(style)
			styleRef.current = style
		}

		style.textContent = `
			.monaco-editor .view-lines .view-line {
				border-bottom: 1px solid ${transparentColor} !important;
			}
		`
	}, [enabled, editorRef, textColor])

	// 行デコレーションスタイルを削除する関数
	const removeLineDecorations = useCallback(() => {
		if (styleRef.current) {
			styleRef.current.remove()
			styleRef.current = null
		}
	}, [])

	// スタイルを初期化
	useEffect(() => {
		if (enabled) {
			addLineDecorations()
		}

		return () => {
			// クリーンアップ
			removeLineDecorations()
		}
	}, [enabled, addLineDecorations, removeLineDecorations])

	return {
		addLineDecorations,
		removeLineDecorations,
	}
}
