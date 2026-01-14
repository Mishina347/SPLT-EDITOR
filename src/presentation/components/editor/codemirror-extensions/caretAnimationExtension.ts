import { Extension } from '@codemirror/state'
import { EditorView } from '@codemirror/view'

interface CaretAnimationOptions {
	enabled: boolean
	fontSize: number
	textColor: string
}

/**
 * カーソルアニメーション拡張機能
 * カーソルのパルス/ブリンクアニメーションを提供
 */
export function caretAnimationExtension(options: CaretAnimationOptions): Extension {
	const { enabled, fontSize, textColor } = options

	if (!enabled) return []

	// アニメーション用のCSSスタイル
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
		
		.cm-cursor {
			transition: transform 0.1s ease-out !important;
		}
		
		.cm-cursor.caret-pulse-animation {
			animation: caretPulse 0.8s ease-out !important;
		}
		
		.cm-cursor.caret-blink-animation {
			animation: caretBlink 0.8s ease-in-out 2 !important;
		}
	`
	document.head.appendChild(style)

	// テーマでカーソルスタイルを定義
	const theme = EditorView.theme({
		'.cm-cursor': {
			transition: 'transform 0.1s ease-out',
		},
	})

	return [
		theme,
		// クリーンアップ用の拡張機能
		EditorView.updateListener.of(() => {
			// 必要に応じてアニメーションをトリガー
		}),
	]
}

/**
 * カーソルアニメーションをトリガーする関数
 */
export function triggerCaretAnimation(
	view: EditorView,
	type: 'pulse' | 'blink' = 'pulse',
	withRipple: boolean = false
) {
	const cursorElement = view.dom.querySelector('.cm-cursor') as HTMLElement
	if (!cursorElement) return

	// 既存のアニメーションクラスを削除
	cursorElement.classList.remove('caret-pulse-animation', 'caret-blink-animation')

	// 新しいアニメーションクラスを追加
	const animationClass = type === 'pulse' ? 'caret-pulse-animation' : 'caret-blink-animation'
	cursorElement.classList.add(animationClass)

	// 波紋効果の実行（withRippleフラグがtrueの場合のみ）
	if (withRipple) {
		const position = view.state.selection.main.head
		const coords = view.coordsAtPos(position)
		if (coords) {
			// フォントサイズを取得（デフォルト16px）
			const fontSize = 16
			const ripple = document.createElement('div')
			ripple.style.position = 'absolute'
			ripple.style.margin = 'auto'
			ripple.style.left = `${coords.left}px`
			ripple.style.top = `${coords.top}px`
			ripple.style.width = `${fontSize}px`
			ripple.style.height = `${fontSize}px`
			ripple.style.border = `0.5px solid currentColor`
			ripple.style.borderRadius = '50%'
			ripple.style.pointerEvents = 'none'
			ripple.style.zIndex = '1001'
			ripple.style.backgroundColor = 'transparent'
			ripple.style.animation = 'rippleWave 0.8s ease-out forwards'

			view.dom.appendChild(ripple)

			setTimeout(() => {
				if (ripple.parentNode) {
					ripple.parentNode.removeChild(ripple)
				}
			}, 1200)
		}
	}

	// アニメーション終了後にクラスを削除
	const duration = type === 'pulse' ? 800 : 2000
	setTimeout(() => {
		cursorElement.classList.remove(animationClass)
	}, duration)
}
