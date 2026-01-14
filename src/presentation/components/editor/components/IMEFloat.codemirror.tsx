import { EditorView } from '@codemirror/view'
import { useCallback, useRef } from 'react'

interface UseIMEFloatCodeMirrorProps {
	containerRef: React.RefObject<HTMLDivElement | null>
	editorRef: React.RefObject<EditorView | null>
	fontSize: number
	fontFamily: string
	backgroundColor: string
	textColor: string
	enabled: boolean
}

export const useIMEFloatCodeMirror = ({
	containerRef,
	editorRef,
	fontSize,
	fontFamily,
	backgroundColor,
	textColor,
	enabled,
}: UseIMEFloatCodeMirrorProps) => {
	const imeFloatRef = useRef<HTMLDivElement | null>(null)

	const createIMEFloat = useCallback(() => {
		if (!enabled || !editorRef.current || !containerRef.current) return

		const view = editorRef.current
		const selection = view.state.selection.main
		const pos = selection.head

		// カーソル位置の座標を取得（ビューポート座標）
		const coords = view.coordsAtPos(pos)
		if (!coords) return

		// コンテナの位置を取得して相対座標に変換
		const containerRect = containerRef.current.getBoundingClientRect()
		// キャレットの左端を基点にして右に伸びる
		const relativeLeft = coords.left - containerRect.left
		const relativeTop = coords.top - containerRect.top

		const floatBg = backgroundColor
		const floatTextColor = textColor
		const caretHeight = fontSize * 1.4

		const floatDiv = document.createElement('div')
		floatDiv.style.position = 'absolute'
		// キャレットの左端を基点にして右に伸びる
		floatDiv.style.left = `${relativeLeft}px`
		floatDiv.style.top = `${relativeTop - 8}px`
		floatDiv.style.height = `${caretHeight + 10}px`
		floatDiv.style.lineHeight = `${caretHeight}px`
		floatDiv.style.backgroundColor = floatBg
		floatDiv.style.color = floatTextColor
		floatDiv.style.borderRadius = '2px'
		floatDiv.style.padding = '0 4px 4px 4px'
		floatDiv.style.fontSize = `${fontSize * 1.1}px`
		floatDiv.style.fontFamily = fontFamily
		floatDiv.style.boxShadow = '0 2px 8px rgba(0, 0, 0, 0.15)'
		floatDiv.style.zIndex = '1000'
		floatDiv.style.pointerEvents = 'none'
		floatDiv.style.whiteSpace = 'nowrap'
		floatDiv.style.display = 'flex'
		floatDiv.style.alignItems = 'center'
		floatDiv.style.flexDirection = 'row' // 左から右へ
		floatDiv.style.opacity = '1'

		if (!document.getElementById('ime-caret-animation')) {
			const style = document.createElement('style')
			style.id = 'ime-caret-animation'
			style.textContent = `@keyframes blink { 0%, 40% { opacity: 1; transform: scaleX(1); } 50%, 90% { opacity: 0.3; transform: scaleX(0.8); } 100% { opacity: 1; transform: scaleX(1); } }`
			document.head.appendChild(style)
		}

		// テキスト用のプレースホルダー（空の場合は後で追加される）
		// キャレットは常に末尾（右側）に配置されるため、ここでは追加しない

		containerRef.current.appendChild(floatDiv)
		imeFloatRef.current = floatDiv
	}, [enabled, editorRef, containerRef, fontSize, fontFamily, backgroundColor, textColor])

	const updateIMEFloatContent = useCallback(
		(text: string) => {
			if (!enabled || !imeFloatRef.current) return

			// フロートの位置は固定（IME入力開始時に設定した位置を維持）
			// テキストのみを更新する
			imeFloatRef.current.innerHTML = ''

			// テキストを先に追加（左側に表示される）
			if (text) {
				const textSpan = document.createElement('span')
				textSpan.textContent = text
				imeFloatRef.current.appendChild(textSpan)
			}

			// キャレットを後に追加すると右側（末尾）に表示される
			const caretSpan = document.createElement('span')
			caretSpan.style.width = '2px'
			caretSpan.style.height = `${fontSize * 1.2}px`
			caretSpan.style.backgroundColor = textColor
			caretSpan.style.marginLeft = '2px' // テキストの右側に表示されるため左マージン
			caretSpan.style.borderRadius = '1px'
			caretSpan.style.display = 'inline-block'
			caretSpan.style.opacity = '1'
			caretSpan.style.transformOrigin = 'center'
			caretSpan.style.animation = 'blink 0.8s infinite'
			imeFloatRef.current.appendChild(caretSpan)
		},
		[enabled, fontSize, textColor]
	)

	const removeIMEFloat = useCallback(() => {
		if (!enabled) return
		if (imeFloatRef.current) {
			imeFloatRef.current.remove()
			imeFloatRef.current = null
		}
	}, [enabled])

	return { createIMEFloat, updateIMEFloatContent, removeIMEFloat, imeFloatRef }
}
