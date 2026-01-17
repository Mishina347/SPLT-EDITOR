import { useEffect, useRef, useCallback } from 'react'
import { EditorView } from '@codemirror/view'
import { EditorState, Compartment } from '@codemirror/state'
import { basicSetup } from 'codemirror'
import { EditorSettings } from '@/domain'
import { logger } from '@/utils/logger'
import { imeExtension } from './codemirror-extensions/imeExtension'
import { lineDecorationExtension } from './codemirror-extensions/lineDecorationExtension'
import {
	caretAnimationExtension,
	triggerCaretAnimation,
} from './codemirror-extensions/caretAnimationExtension'
import {
	selectionCountExtension,
	SelectionCharCount,
} from './codemirror-extensions/selectionCountExtension'
import { kinsokuExtension } from './codemirror-extensions/kinsokuExtension'

interface CodeMirrorEditorProps {
	containerRef: React.RefObject<HTMLDivElement>
	value: string
	settings: EditorSettings
	onChange: (value: string) => void
	onSelectionChange?: (selection: SelectionCharCount) => void
	// IME入力関連のコールバック
	onIMEStart?: () => void
	onIMEUpdate?: (text: string) => void
	onIMEEnd?: (text: string) => void
	// カーソルアニメーション関連
	onCaretAnimation?: (type: 'pulse' | 'blink', withRipple: boolean) => void
	// viewRefを外部からアクセスできるようにする
	onEditorRef?: (view: EditorView | null) => void
}

export const CodeMirrorEditor = ({
	containerRef,
	value,
	settings,
	onChange,
	onSelectionChange,
	onIMEStart,
	onIMEUpdate,
	onIMEEnd,
	onCaretAnimation,
	onEditorRef,
}: CodeMirrorEditorProps) => {
	const viewRef = useRef<EditorView | null>(null)
	const themeCompartment = useRef(new Compartment())
	const fontSizeCompartment = useRef(new Compartment())
	const fontFamilyCompartment = useRef(new Compartment())
	const imeCompositionRef = useRef(false)

	// エディタの初期化
	useEffect(() => {
		if (!containerRef.current || viewRef.current) return

		const { fontSize, fontFamily, backgroundColor, textColor, wordWrapColumn } = settings

		// wordWrapColumnの値を使って左右パディングを計算
		const leftPadding = wordWrapColumn || 10
		const rightPadding = wordWrapColumn || 20

		// テーマ設定
		const themeExtension = EditorView.theme({
			'&': {
				backgroundColor,
				color: textColor,
				fontSize: `${fontSize}px`,
				fontFamily,
				height: '100%',
			},
			'.cm-content': {
				padding: `10px ${rightPadding}px 10px ${leftPadding}px`, // wordWrapColumnの値を使用
				minHeight: '100%',
				fontSize: `${fontSize}px`,
				fontFamily,
				lineHeight: `${fontSize * 1.5}px`,
				letterSpacing: '0.5px',
			},
			'.cm-focused': {
				outline: 'none',
			},
			'.cm-editor': {
				height: '100%',
			},
			'.cm-scroller': {
				fontFamily,
				fontSize: `${fontSize}px`,
			},
			'.cm-line': {
				padding: '0 4px',
				minHeight: `${fontSize * 1.5}px`,
			},
			'.cm-cursor': {
				borderLeftWidth: '2px',
				borderLeftColor: textColor,
				marginLeft: '-1px',
			},
			'.cm-selectionBackground': {
				backgroundColor: `${textColor}30`, // 19%透明度
			},
			'.cm-gutters': {
				backgroundColor: backgroundColor,
				borderRight: 'none',
			},
			'.cm-lineNumbers': {
				minWidth: '3ch',
				backgroundColor: backgroundColor,
			},
			'.cm-lineNumbers .cm-gutterElement': {
				padding: '0 8px 0 4px',
				color: `${textColor}80`, // 50%透明度
				fontSize: `${fontSize}px`,
				backgroundColor: backgroundColor,
			},
			'.cm-lineNumbers .cm-activeLineGutter': {
				color: textColor,
				backgroundColor: backgroundColor,
			},
			'.cm-activeLine': {
				backgroundColor:
					backgroundColor === '#ffffff'
						? '#f8f8f8' // 白背景の場合は薄いグレー
						: backgroundColor === '#000000'
							? '#1a1a1a' // 黒背景の場合は薄い黒
							: `${backgroundColor}20`, // その他の場合は透明度付き
				borderLeft: `2px solid ${textColor}`,
				marginLeft: '-4px', // paddingを相殺
				paddingLeft: '2px', // テキストが線に重ならないように
			},
		})

		// エディタ状態を作成
		const state = EditorState.create({
			doc: value,
			extensions: [
				basicSetup,
				themeCompartment.current.of(themeExtension),
				// IME入力対応
				imeExtension({
					onCompositionStart: () => {
						imeCompositionRef.current = true
						onIMEStart?.()
					},
					onCompositionUpdate: (text: string) => {
						onIMEUpdate?.(text)
					},
					onCompositionEnd: (text: string) => {
						imeCompositionRef.current = false
						onIMEEnd?.(text)
					},
				}),
				// 行デコレーション
				lineDecorationExtension(textColor, true),
				// カーソルアニメーション
				caretAnimationExtension({
					enabled: true,
					fontSize,
					textColor,
				}),
				// 選択範囲カウント
				selectionCountExtension({
					onSelectionChange,
					wordWrapColumn,
				}),
				// 禁則処理
				kinsokuExtension(),
				// コンテンツ変更の監視
				EditorView.updateListener.of(update => {
					if (update.docChanged && !imeCompositionRef.current) {
						const newValue = update.state.doc.toString()
						if (newValue !== value) {
							onChange(newValue)
						}
					}
				}),
				// 自動折り返し
				EditorView.lineWrapping,
			],
		})

		// エディタビューを作成
		const view = new EditorView({
			state,
			parent: containerRef.current,
		})

		viewRef.current = view
		onEditorRef?.(view)
		logger.debug('CodeMirrorEditor', 'Editor initialized')

		return () => {
			view.destroy()
			viewRef.current = null
			onEditorRef?.(null)
		}
	}, [containerRef, onEditorRef])

	// 設定変更時の更新
	useEffect(() => {
		if (!viewRef.current) return

		const { fontSize, fontFamily, backgroundColor, textColor, wordWrapColumn } = settings

		// wordWrapColumnの値を使って左右パディングを計算
		const leftPadding = wordWrapColumn || 10
		const rightPadding = wordWrapColumn || 20

		// テーマを更新
		const themeExtension = EditorView.theme({
			'&': {
				backgroundColor,
				color: textColor,
				fontSize: `${fontSize}px`,
				fontFamily,
				height: '100%',
			},
			'.cm-content': {
				padding: `10px ${rightPadding}px 10px ${leftPadding}px`, // wordWrapColumnの値を使用
				minHeight: '100%',
				fontSize: `${fontSize}px`,
				fontFamily,
				lineHeight: `${fontSize * 1.5}px`,
				letterSpacing: '0.5px',
			},
			'.cm-scroller': {
				fontFamily,
				fontSize: `${fontSize}px`,
			},
			'.cm-line': {
				padding: '0 4px',
				minHeight: `${fontSize * 1.5}px`,
			},
			'.cm-cursor': {
				borderLeftWidth: '2px',
				borderLeftColor: textColor,
				marginLeft: '-1px',
			},
			'.cm-selectionBackground': {
				backgroundColor: `${textColor}30`, // 19%透明度
			},
			'.cm-gutters': {
				backgroundColor: backgroundColor,
				borderRight: 'none',
			},
			'.cm-lineNumbers': {
				minWidth: '3ch',
				backgroundColor: backgroundColor,
			},
			'.cm-lineNumbers .cm-gutterElement': {
				padding: '0 8px 0 4px',
				color: `${textColor}80`, // 50%透明度
				fontSize: `${fontSize}px`,
				backgroundColor: backgroundColor,
			},
			'.cm-lineNumbers .cm-activeLineGutter': {
				color: textColor,
				backgroundColor: backgroundColor,
			},
			'.cm-activeLine': {
				backgroundColor:
					backgroundColor === '#ffffff'
						? '#f8f8f8' // 白背景の場合は薄いグレー
						: backgroundColor === '#000000'
							? '#1a1a1a' // 黒背景の場合は薄い黒
							: `${backgroundColor}20`, // その他の場合は透明度付き
			},
		})

		viewRef.current.dispatch({
			effects: themeCompartment.current.reconfigure(themeExtension),
		})
	}, [
		settings.backgroundColor,
		settings.textColor,
		settings.fontSize,
		settings.fontFamily,
		settings.wordWrapColumn,
	])

	// 値の変更を反映
	useEffect(() => {
		if (!viewRef.current) return

		const currentValue = viewRef.current.state.doc.toString()
		if (currentValue !== value) {
			viewRef.current.dispatch({
				changes: {
					from: 0,
					to: viewRef.current.state.doc.length,
					insert: value,
				},
			})
		}
	}, [value])

	// viewRefを外部からアクセスできるようにする
	useEffect(() => {
		if (viewRef.current && onCaretAnimation) {
			// カーソルアニメーションのトリガーを設定
			const handleKeyDown = (e: KeyboardEvent) => {
				if (e.key === 'Control' && !e.repeat && viewRef.current) {
					triggerCaretAnimation(viewRef.current, 'pulse', true)
				}
			}
			document.addEventListener('keydown', handleKeyDown)
			return () => {
				document.removeEventListener('keydown', handleKeyDown)
			}
		}
	}, [viewRef.current, onCaretAnimation])

	return null
}

// viewRefを外部からアクセスできるようにするためのrefを返す
export function useCodeMirrorEditorRef() {
	return useRef<EditorView | null>(null)
}
