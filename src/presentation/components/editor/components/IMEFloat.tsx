import * as monaco from 'monaco-editor'
import { useCallback, useRef } from 'react'

interface UseIMEFloatProps {
	containerRef: React.RefObject<HTMLDivElement | null>
	editorRef: React.RefObject<monaco.editor.IStandaloneCodeEditor | null>
	fontSize: number
	fontFamily: string
	backgroundColor: string
	textColor: string
	enabled: boolean
}

export const useIMEFloat = ({
	containerRef,
	editorRef,
	fontSize,
	fontFamily,
	backgroundColor,
	textColor,
	enabled,
}: UseIMEFloatProps) => {
	const imeFloatRef = useRef<HTMLDivElement | null>(null)

	// IMEフロート要素を作成する関数
	const createIMEFloat = useCallback(() => {
		if (!enabled || !editorRef.current || !containerRef.current) return

		const editor = editorRef.current
		const position = editor.getPosition()
		if (!position) return

		// カーソル位置を取得
		const coords = editor.getScrolledVisiblePosition(position)
		if (!coords) return

		// エディタのテーマ色を取得
		const floatBg = backgroundColor
		const floatTextColor = textColor

		// キャレットの高さを計算（フォントサイズベース）
		const caretHeight = fontSize * 1.4 // 行の高さに合わせる

		// フロート要素を作成
		const floatDiv = document.createElement('div')
		floatDiv.style.position = 'absolute'
		floatDiv.style.left = `${coords.left}px`
		floatDiv.style.top = `${coords.top}px`
		floatDiv.style.height = `${caretHeight}px`
		floatDiv.style.lineHeight = `${caretHeight}px`
		floatDiv.style.backgroundColor = floatBg
		floatDiv.style.color = floatTextColor
		floatDiv.style.borderRadius = '2px'
		floatDiv.style.padding = '0 4px'
		floatDiv.style.fontSize = `${fontSize * 1.1}px`
		floatDiv.style.fontFamily = fontFamily
		floatDiv.style.boxShadow = '0 2px 8px rgba(0, 0, 0, 0.15)'
		floatDiv.style.zIndex = '1000'
		floatDiv.style.pointerEvents = 'none'
		floatDiv.style.whiteSpace = 'nowrap'
		floatDiv.style.display = 'flex'
		floatDiv.style.alignItems = 'center'
		floatDiv.style.opacity = '1'

		// キャレット点滅アニメーションのCSSを追加
		if (!document.getElementById('ime-caret-animation')) {
			const style = document.createElement('style')
			style.id = 'ime-caret-animation'
			style.textContent = `
				@keyframes blink {
					0%, 40% { 
						opacity: 1;
						transform: scaleX(1);
					}
					50%, 90% { 
						opacity: 0.3;
						transform: scaleX(0.8);
					}
					100% { 
						opacity: 1;
						transform: scaleX(1);
					}
				}
			`
			document.head.appendChild(style)
		}

		// 擬似キャレット用のspan要素を作成
		const caretSpan = document.createElement('span')
		caretSpan.style.width = '2px'
		caretSpan.style.height = `${fontSize * 1.2}px`
		caretSpan.style.backgroundColor = floatTextColor
		caretSpan.style.marginLeft = '2px'
		caretSpan.style.display = 'inline-block'
		caretSpan.style.borderRadius = '1px'
		caretSpan.style.animation = 'blink 0.8s infinite'
		caretSpan.style.opacity = '1'
		caretSpan.style.transformOrigin = 'center'

		// 初期状態では擬似キャレットのみ表示
		floatDiv.appendChild(caretSpan)

		// コンテナに追加
		containerRef.current.appendChild(floatDiv)
		imeFloatRef.current = floatDiv
	}, [enabled, editorRef, containerRef, fontSize, fontFamily, backgroundColor, textColor])

	// IMEフロート内容を更新する関数
	const updateIMEFloatContent = useCallback(
		(text: string) => {
			if (!enabled || !imeFloatRef.current) return

			// 既存の内容をクリア
			imeFloatRef.current.innerHTML = ''

			// テキストを追加
			if (text) {
				const textSpan = document.createElement('span')
				textSpan.textContent = text
				imeFloatRef.current.appendChild(textSpan)
			}

			// 擬似キャレットを追加
			const caretSpan = document.createElement('span')
			caretSpan.style.width = '2px'
			caretSpan.style.height = `${fontSize * 1.2}px`
			caretSpan.style.backgroundColor = textColor
			caretSpan.style.marginLeft = '2px'
			caretSpan.style.borderRadius = '1px'
			caretSpan.style.display = 'inline-block'
			caretSpan.style.animation = 'blink 0.8s infinite'
			caretSpan.style.opacity = '1'
			caretSpan.style.transformOrigin = 'center'
			imeFloatRef.current.appendChild(caretSpan)
		},
		[enabled, fontSize, textColor]
	)

	// IMEフロート表示を削除する関数
	const removeIMEFloat = useCallback(() => {
		if (!enabled) return

		if (imeFloatRef.current) {
			imeFloatRef.current.remove()
			imeFloatRef.current = null
		}
	}, [enabled])

	return {
		createIMEFloat,
		updateIMEFloatContent,
		removeIMEFloat,
		imeFloatRef,
	}
}
