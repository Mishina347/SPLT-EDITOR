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
	const createIMEFloat = useCallback(() => {
		if (!enabled || !editorRef.current || !containerRef.current) return
		const editor = editorRef.current
		const position = editor.getPosition()
		if (!position) return
		const coords = editor.getScrolledVisiblePosition(position)
		if (!coords) return
		const floatBg = backgroundColor
		const floatTextColor = textColor
		const caretHeight = fontSize * 1.4
		const floatDiv = document.createElement('div')
		floatDiv.style.position = 'absolute'
		floatDiv.style.left = `${coords.left}px`
		floatDiv.style.top = `${coords.top - 8}px`
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
		floatDiv.style.opacity = '1'
		if (!document.getElementById('ime-caret-animation')) {
			const style = document.createElement('style')
			style.id = 'ime-caret-animation'
			style.textContent = `@keyframes blink { 0%, 40% { opacity: 1; transform: scaleX(1); } 50%, 90% { opacity: 0.3; transform: scaleX(0.8); } 100% { opacity: 1; transform: scaleX(1); } }`
			document.head.appendChild(style)
		}
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
		floatDiv.appendChild(caretSpan)
		containerRef.current.appendChild(floatDiv)
		imeFloatRef.current = floatDiv
	}, [enabled, editorRef, containerRef, fontSize, fontFamily, backgroundColor, textColor])
	const updateIMEFloatContent = useCallback(
		(text: string) => {
			if (!enabled || !imeFloatRef.current) return
			imeFloatRef.current.innerHTML = ''
			if (text) {
				const textSpan = document.createElement('span')
				textSpan.textContent = text
				imeFloatRef.current.appendChild(textSpan)
			}
			const caretSpan = document.createElement('span')
			caretSpan.style.width = '2px'
			caretSpan.style.height = `${fontSize * 1.2}px`
			caretSpan.style.backgroundColor = textColor
			caretSpan.style.marginLeft = '2px'
			caretSpan.style.borderRadius = '1px'
			caretSpan.style.display = 'inline-block'
			caretSpan.style.opacity = '1'
			caretSpan.style.transformOrigin = 'center'
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
