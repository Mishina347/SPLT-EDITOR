import * as monaco from 'monaco-editor'
import { useCallback, useEffect, useRef } from 'react'

interface UseCaretAnimationProps {
	editorRef: React.RefObject<monaco.editor.IStandaloneCodeEditor | null>
	containerRef: React.RefObject<HTMLDivElement | null>
	fontSize: number
	textColor: string
	enabled: boolean
}

export const useCaretAnimation = ({
	editorRef,
	containerRef,
	fontSize,
	textColor,
	enabled,
}: UseCaretAnimationProps) => {
	const animationStyleRef = useRef<HTMLStyleElement | null>(null)

	// キャレットアニメーション用のCSSスタイルを追加する関数
	const addCaretAnimationStyles = useCallback(() => {
		if (!enabled || animationStyleRef.current) return

		const style = document.createElement('style')
		style.id = 'caret-animation-styles'
		style.textContent = `
			@keyframes caretPulse {
				0% { 
					transform: scale(1);
					opacity: 1;
				}
				25% { 
					transform: scale(1.8);
					opacity: 0.7;
				}
				50% { 
					transform: scale(1.4);
					opacity: 0.8;
				}
				75% { 
					transform: scale(1.2);
					opacity: 0.9;
				}
				100% { 
					transform: scale(1);
					opacity: 1;
				}
			}
			
			@keyframes rippleWave {
				0% {
					transform: translate(-50%, -50%) scale(0);
					opacity: 0;
				}
				10% {
					opacity: 0.8;
				}
				50% {
					opacity: 0.6;
				}
				90% {
					opacity: 0.2;
				}
				100% {
					transform: translate(-50%, -50%) scale(2);
					opacity: 0;
				}
			}
			
			@keyframes caretBlink {
				0%, 50% { opacity: 1; }
				51%, 100% { opacity: 0.2; }
			}
			
			.monaco-editor .cursors-layer .cursor {
				transition: transform 0.1s ease-out !important;
			}
			
			.monaco-editor .cursors-layer .cursor.caret-pulse-animation {
				animation: caretPulse 0.8s ease-out !important;
			}
			
			.monaco-editor .cursors-layer .cursor.caret-blink-animation {
				animation: caretBlink 0.8s ease-in-out 2 !important;
			}
		`
		document.head.appendChild(style)
		animationStyleRef.current = style
	}, [enabled])

	// 波紋効果を作成する関数
	const createRippleEffect = useCallback(() => {
		if (!enabled || !editorRef.current || !containerRef.current) return

		const editor = editorRef.current
		const position = editor.getPosition()
		if (!position) return

		// キャレットの位置を取得
		const coords = editor.getScrolledVisiblePosition(position)
		if (!coords) return

		// 波紋要素を作成
		const ripple = document.createElement('div')
		ripple.style.position = 'absolute'
		ripple.style.margin = 'auto'
		ripple.style.left = `${coords.left}px`
		ripple.style.top = `${coords.top + fontSize * 0.5}px` // キャレット中央
		ripple.style.width = `${fontSize}px`
		ripple.style.height = `${fontSize}px`
		ripple.style.border = `0.5px solid ${textColor}`
		ripple.style.borderRadius = '50%'
		ripple.style.pointerEvents = 'none'
		ripple.style.zIndex = '1001'
		ripple.style.backgroundColor = 'transparent'
		ripple.style.animation = 'rippleWave 0.8s ease-out forwards'

		// エディタコンテナに追加
		containerRef.current.appendChild(ripple)

		// アニメーション終了後に削除
		setTimeout(() => {
			if (ripple.parentNode) {
				ripple.parentNode.removeChild(ripple)
			}
		}, 1200)
	}, [enabled, editorRef, containerRef, fontSize, textColor])

	// キャレットアニメーションをトリガーする関数
	const triggerCaretAnimation = useCallback(
		(type: 'pulse' | 'blink' = 'pulse', withRipple: boolean = false) => {
			if (!enabled || !editorRef.current) return

			const caretElement = document.querySelector(
				'.monaco-editor .cursors-layer .cursor'
			) as HTMLElement
			if (!caretElement) return

			// 既存のアニメーションクラスを削除
			caretElement.classList.remove('caret-pulse-animation', 'caret-blink-animation')

			// 新しいアニメーションクラスを追加
			const animationClass = type === 'pulse' ? 'caret-pulse-animation' : 'caret-blink-animation'
			caretElement.classList.add(animationClass)

			// 波紋効果の実行（withRippleフラグがtrueの場合のみ）
			if (withRipple) {
				createRippleEffect()
			}

			// アニメーション終了後にクラスを削除
			const duration = type === 'pulse' ? 800 : 2000 // pulse: 0.8s, blink: 0.5s * 4 = 2s
			setTimeout(() => {
				caretElement.classList.remove(animationClass)
			}, duration)
		},
		[enabled, editorRef, createRippleEffect]
	)

	// スタイルを初期化
	useEffect(() => {
		if (enabled) {
			addCaretAnimationStyles()
		}

		return () => {
			// クリーンアップ
			if (animationStyleRef.current) {
				animationStyleRef.current.remove()
				animationStyleRef.current = null
			}
		}
	}, [enabled, addCaretAnimationStyles])

	return {
		triggerCaretAnimation,
		addCaretAnimationStyles,
		createRippleEffect,
	}
}
