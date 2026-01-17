import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { EditorView } from '@codemirror/view'

import {
	useResizeObserver,
	usePerformanceOptimization,
	usePerformanceMonitor,
	useViewportSize,
	useOptimizedLayout,
} from '../../hooks'
import { DEFAULT_SETTING, EditorSettings } from '@/domain'
import { calculateScaleWithViewport } from '@/utils/scaleCalculator'
import { logger } from '@/utils/logger'
import { ScaleInfo } from '@/types/common'

import styles from './EditorComponent.module.css'
import buttonStyles from '../../shared/Button/Button.module.css'

import { Counter } from './components/Counter/Counter'
import { isMobileSize, isPortrait } from '@/utils/deviceDetection'
import { CodeMirrorEditor } from './CodeMirrorEditor'
import { triggerCaretAnimation } from './codemirror-extensions/caretAnimationExtension'
import { useIMEFloatCodeMirror } from './components/IMEFloat.codemirror'

type Props = {
	textData: string
	extended: boolean
	settings: EditorSettings
	isDragging?: boolean
	isMaximized: boolean
	onChange: (v: string) => void
	onMaximize: () => void
	onFocusPane: () => void
	onSelectionChange?: (selectionCharCount: {
		selectedText: string
		characterCount: number
		lineCount: number
		pageCount: number
	}) => void
}

export const EditorComponent = ({
	textData,
	extended,
	onChange,
	settings,
	isDragging,
	isMaximized,
	onMaximize,
	onFocusPane,
	onSelectionChange,
}: Props) => {
	// パフォーマンス監視
	const performanceMonitor = usePerformanceMonitor('EditorComponent')

	const containerRef = useRef<HTMLDivElement>(null)
	const editorRef = useRef<EditorView | null>(null)
	const wrapperRef = useRef<HTMLDivElement>(null) // エディタ全体のWrapper
	const isInnerFocusRef = useRef(false) // エディタ内部フォーカス状態
	const imeCompositionRef = useRef(false) // IME入力中フラグ
	// IME入力中の未確定文字を保持するref
	const imeCompositionTextRef = useRef<string>('')

	// 倍率計算の状態
	const [scaleInfo, setScaleInfo] = useState<ScaleInfo>({
		zoom: 1,
		transformScale: 1,
		totalScale: 1,
		viewportScale: 1,
	})

	// 設定値をメモ化
	const { fontSize, wordWrapColumn, backgroundColor, textColor, fontFamily } = useMemo(
		() => ({
			fontSize: settings.fontSize,
			wordWrapColumn: settings.wordWrapColumn,
			backgroundColor: settings.backgroundColor,
			textColor: settings.textColor,
			fontFamily: settings.fontFamily,
		}),
		[
			settings.fontSize,
			settings.wordWrapColumn,
			settings.backgroundColor,
			settings.textColor,
			settings.fontFamily,
		]
	)

	const cellSize = useMemo(() => fontSize * 1.6, [fontSize])

	// 日本語の禁則文字定義（editorOptionsより前に定義）
	const kinsokuCharacters = useMemo(() => {
		// 行頭禁則（行頭に来てはいけない文字）
		// 句読点、閉じ括弧、長音記号、小文字など
		const lineHeadProhibited =
			'。、，．：；！？）］｝」』〉》〕〗〙〛ゝゞヽヾーァィゥェォッャュョヮヵヶぁぃぅぇぉっゃゅょゎゕゖ'

		// 行末禁則（行末に来てはいけない文字）
		// 開き括弧など
		const lineEndProhibited = '（［｛「『〈《〔〖〘〙'

		// wordWrapBreakAfterCharacters: これらの文字の後に改行を許可
		// Monaco Editorの自動折り返し（wordWrapColumn）で使用される
		// 行頭禁則文字を含めないことで、これらの文字が行頭に来ないようにする
		// 通常の文字（空白、タブ、英数字、ひらがな、カタカナ、漢字など）の後に改行を許可
		// ただし、行頭禁則文字の前では改行しない
		const breakAfter =
			' \t})]?|&,;abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789あいうえおかきくけこさしすせそたちつてとなにぬねのはひふへほまみむめもやゆよらりるれろわをんアイウエオカキクケコサシスセソタチツテトナニヌネノハヒフヘホマミムメモヤユヨラリルレロワヲン'

		// wordWrapBreakBeforeCharacters: これらの文字の前に改行を許可
		// Monaco Editorの自動折り返し（wordWrapColumn）で使用される
		// 行末禁則文字を含めないことで、これらの文字が行末に来ないようにする
		// 通常の文字（開き括弧、英数字、ひらがな、カタカナ、漢字など）の前に改行を許可
		// ただし、行末禁則文字の前では改行しない
		const breakBefore =
			'{([+abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789あいうえおかきくけこさしすせそたちつてとなにぬねのはひふへほまみむめもやゆよらりるれろわをんアイウエオカキクケコサシスセソタチツテトナニヌネノハヒフヘホマミムメモヤユヨラリルレロワヲン'

		return {
			breakAfter,
			breakBefore,
			lineHeadProhibited,
			lineEndProhibited,
		}
	}, [])

	// カーソルアニメーションはCodeMirrorEditorの拡張機能で実装済み

	// 画面の向きとデバイスサイズを検出してIMEフロートの有効/無効を決定
	const viewportSize = useViewportSize()
	const isPortraitMode = useMemo(() => isPortrait(), [viewportSize])
	const isMobileDevice = useMemo(() => isMobileSize(), [viewportSize])
	const shouldUseIMEFloat = useMemo(() => {
		// IMEフロートを無効化
		return false
	}, [])

	// IMEフロート機能（CodeMirror 6用）
	const { createIMEFloat, updateIMEFloatContent, removeIMEFloat } = useIMEFloatCodeMirror({
		containerRef,
		editorRef,
		fontSize,
		fontFamily,
		backgroundColor,
		textColor,
		enabled: shouldUseIMEFloat,
	})

	// 最適化されたレイアウト更新フック
	const { updateLayout, cleanup: cleanupLayout } = useOptimizedLayout()

	// パフォーマンス最適化フック
	const { debounce } = usePerformanceOptimization()

	// 倍率計算のロジック
	const updateScaleInfo = useCallback(() => {
		if (containerRef.current) {
			const newScaleInfo = calculateScaleWithViewport(containerRef.current)
			setScaleInfo(newScaleInfo)

			logger.debug('EditorComponent', 'Scale info updated', {
				element: 'Editor',
				...newScaleInfo,
			})
		}
	}, [])

	// 最適化されたResizeObserver
	const debouncedUpdateScaleInfo = useMemo(
		() => debounce(updateScaleInfo, 100),
		[debounce, updateScaleInfo]
	)

	const { observe, unobserve } = useResizeObserver(debouncedUpdateScaleInfo)

	// 倍率計算の初期化と監視
	useEffect(() => {
		// 初期倍率を計算
		updateScaleInfo()

		// ResizeObserverでサイズ変更を監視
		if (containerRef.current) {
			observe(containerRef.current)
		}

		return () => {
			unobserve()
		}
	}, [updateScaleInfo, observe, unobserve])

	// 通常のonChange関数
	const handleChange = useCallback(
		(newValue: string) => {
			onChange(newValue)
		},
		[onChange]
	)

	// エディタ内部にフォーカスを移す関数
	const focusIntoEditor = useCallback(() => {
		if (editorRef.current && wrapperRef.current) {
			isInnerFocusRef.current = true
			editorRef.current.focus()
			// 視覚的フィードバックを追加
			wrapperRef.current.setAttribute('data-inner-focus', 'true')
		}
	}, [])

	// CodeMirrorEditorのviewRefを取得するためのコールバック
	const handleEditorRef = useCallback((view: EditorView | null) => {
		editorRef.current = view
		if (view) {
			// エディタが初期化されたらフォーカスイベントを設定
			const dom = view.dom
			const handleFocus = () => {
				isInnerFocusRef.current = true
				if (wrapperRef.current) {
					wrapperRef.current.setAttribute('data-inner-focus', 'true')
				}
			}
			dom.addEventListener('focus', handleFocus, true)
		}
	}, [])

	// エディタ外部にフォーカスを戻す関数
	const focusOutOfEditor = useCallback(() => {
		if (wrapperRef.current) {
			isInnerFocusRef.current = false
			wrapperRef.current.focus()
			wrapperRef.current.setAttribute('data-inner-focus', 'false')
		}
	}, [])

	// 次のフォーカス可能要素に移動する関数
	const focusNextElement = useCallback(() => {
		if (!wrapperRef.current) return

		// 現在のフォーカス可能要素を取得
		const focusableElements = document.querySelectorAll(
			'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
		)
		const currentIndex = Array.from(focusableElements).indexOf(wrapperRef.current)

		if (currentIndex !== -1 && currentIndex < focusableElements.length - 1) {
			// 次の要素にフォーカス
			const nextElement = focusableElements[currentIndex + 1] as HTMLElement
			nextElement.focus()
		}
	}, [])

	// 前のフォーカス可能要素に移動する関数
	const focusPrevElement = useCallback(() => {
		if (!wrapperRef.current) return

		const focusableElements = document.querySelectorAll(
			'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
		)
		const currentIndex = Array.from(focusableElements).indexOf(wrapperRef.current)

		if (currentIndex > 0) {
			// 前の要素にフォーカス
			const prevElement = focusableElements[currentIndex - 1] as HTMLElement
			prevElement.focus()
		}
	}, [])

	// IME入力ハンドラー
	const handleIMEStart = useCallback(() => {
		imeCompositionRef.current = true
		imeCompositionTextRef.current = ''
		if (shouldUseIMEFloat) {
			createIMEFloat()
		}
	}, [shouldUseIMEFloat, createIMEFloat])

	const handleIMEUpdate = useCallback(
		(text: string) => {
			imeCompositionTextRef.current = text
			// IMEFloatが存在する場合は常に更新
			updateIMEFloatContent(text)
		},
		[updateIMEFloatContent]
	)

	const handleIMEEnd = useCallback(
		(text: string) => {
			imeCompositionRef.current = false
			imeCompositionTextRef.current = ''
			if (shouldUseIMEFloat) {
				removeIMEFloat()
			}
		},
		[shouldUseIMEFloat, removeIMEFloat]
	)

	// カーソルアニメーションのハンドラー
	const handleCaretAnimation = useCallback((type: 'pulse' | 'blink', withRipple: boolean) => {
		if (editorRef.current) {
			triggerCaretAnimation(editorRef.current, type, withRipple)
		}
	}, [])

	// コンテナのスタイルをメモ化
	const containerStyle = useMemo(
		() => ({
			marginLeft: '1em',
			position: 'relative' as const,
			minHeight: '85vh',
			maxHeight: '90vh',

			width: '100%',
			background: isDragging ? '#BCC0F3FF' : backgroundColor,
			color: textColor,
			transition: isDragging ? 'none' : 'background-color 0.2s ease, color 0.2s ease', // ドラッグ中はトランジションを無効化
			// overflow: 'hidden', // overflow-guardの表示を防ぐ（一時的に無効化）
		}),
		[isDragging, backgroundColor, textColor]
	)

	// コールバック関数をメモ化（パフォーマンス最適化版）
	const handleMaximize = useCallback(() => {
		onMaximize()
	}, [onMaximize])

	const handleFocusPane = useCallback(() => {
		onFocusPane()
	}, [onFocusPane])

	// CodeMirrorEditorのフォーカスイベント監視
	useEffect(() => {
		if (!containerRef.current) return

		const handleFocus = () => {
			isInnerFocusRef.current = true
			if (wrapperRef.current) {
				wrapperRef.current.setAttribute('data-inner-focus', 'true')
			}
		}

		const handleBlur = () => {
			setTimeout(() => {
				if (isInnerFocusRef.current && document.activeElement !== wrapperRef.current) {
					isInnerFocusRef.current = false
					if (wrapperRef.current) {
						wrapperRef.current.setAttribute('data-inner-focus', 'false')
					}
				}
			}, 0)
		}

		const editorElement = containerRef.current.querySelector('.cm-editor')
		if (editorElement) {
			editorElement.addEventListener('focus', handleFocus, true)
			editorElement.addEventListener('blur', handleBlur, true)
		}

		return () => {
			if (editorElement) {
				editorElement.removeEventListener('focus', handleFocus, true)
				editorElement.removeEventListener('blur', handleBlur, true)
			}
		}
	}, [containerRef.current])

	// エディタwrapperのキーボードハンドラー
	const handleWrapperKeyDown = useCallback(
		(e: React.KeyboardEvent) => {
			// シンプルなキーボード操作
			if (e.key === 'Enter' && !isInnerFocusRef.current) {
				// Enterキーでエディタにフォーカス
				e.preventDefault()
				focusIntoEditor()
			} else if (e.key === 'Escape' && isInnerFocusRef.current) {
				// Escapeキーでエディタからフォーカス解除
				e.preventDefault()
				focusOutOfEditor()
			} else if (e.key === 'Tab' && (e.ctrlKey || e.metaKey)) {
				// Ctrl+Tab または Cmd+Tab: フォーカス移動
				e.preventDefault()
				if (e.shiftKey) {
					// Ctrl+Shift+Tab: 前の要素へ
					focusOutOfEditor()
					setTimeout(() => focusPrevElement(), 0)
				} else {
					// Ctrl+Tab: 次の要素へ
					focusOutOfEditor()
					setTimeout(() => focusNextElement(), 0)
				}
			}
		},
		[focusIntoEditor, focusOutOfEditor, focusNextElement, focusPrevElement]
	)

	// 長押し選択を最適化するためのタッチイベントハンドラー
	const handleTouchStart = useCallback((e: React.TouchEvent) => {
		// 長押し選択を有効化するため、タッチイベントを処理
		if (e.touches.length === 1) {
			// シングルタッチの場合、長押し選択を許可
			const target = e.currentTarget as HTMLElement
			target.style.setProperty('--touch-action', 'auto')
		}
	}, [])

	const handleTouchEnd = useCallback((e: React.TouchEvent) => {
		// タッチ終了時にスタイルをリセット
		const target = e.currentTarget as HTMLElement
		target.style.removeProperty('--touch-action')
	}, [])

	return (
		<div className={styles.editorContainer}>
			<main className={styles.editorBody} onFocus={handleFocusPane}>
				<h2 className={styles.srOnly}>テキストエディタ</h2>
				<div
					ref={wrapperRef}
					className={styles.editorWrapper}
					tabIndex={0}
					role="textbox"
					aria-label="テキストエディタ - Enterキーで編集開始、Escapeキーで編集終了"
					aria-multiline="true"
					aria-describedby="editor-instructions"
					data-inner-focus="false"
					onKeyDown={handleWrapperKeyDown}
					onTouchStart={handleTouchStart}
					onTouchEnd={handleTouchEnd}
					onClick={() => {
						// シングルクリックでエディタにフォーカス
						if (!isInnerFocusRef.current) {
							focusIntoEditor()
						}
					}}
					onDoubleClick={focusIntoEditor}
				>
					<div
						ref={containerRef}
						className="codemirror-editor-container"
						style={{
							...containerStyle,
							touchAction: 'auto',
							userSelect: 'text',
							WebkitUserSelect: 'text',
							height: '100%',
						}}
					>
						<CodeMirrorEditor
							containerRef={containerRef}
							value={textData}
							settings={settings}
							onChange={handleChange}
							onSelectionChange={onSelectionChange}
							onIMEStart={handleIMEStart}
							onIMEUpdate={handleIMEUpdate}
							onIMEEnd={handleIMEEnd}
							onCaretAnimation={handleCaretAnimation}
							onEditorRef={handleEditorRef}
						/>
					</div>

					<div id="editor-instructions" className={styles.instructions}>
						<p>Enterキーで編集開始 • Escapeキーで編集終了 • Ctrl+Tabでフォーカス移動</p>
					</div>
					<div className={styles.counterInfoBar} role="status" aria-live="polite">
						<Counter text={textData} />
					</div>
				</div>
			</main>
			<button
				className={`${buttonStyles.maximizeBtn} ${styles.maximizeBtnPosition} 
			${isMaximized ? buttonStyles.buttonActive : buttonStyles.buttonSecondary}
		`}
				aria-pressed={isMaximized ? 'true' : 'false'}
				onClick={e => {
					e.preventDefault()
					e.stopPropagation() // 長押しリサイズとの競合を防ぐ
					onMaximize()
				}}
				onTouchEnd={e => {
					e.preventDefault()
					e.stopPropagation() // 長押しリサイズとの競合を防ぐ
					onMaximize()
				}}
				style={{
					touchAction: 'manipulation',
					WebkitTapHighlightColor: 'rgba(0,0,0,0)',
					zIndex: 1001, // 長押しリサイズエリアより上に配置
				}}
			>
				⛶
			</button>
		</div>
	)
}
