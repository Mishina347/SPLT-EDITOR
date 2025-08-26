import * as monaco from 'monaco-editor'
import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { DEFAULT_SETTING, EditorSettings } from '../../../domain'
import { getOptimizedEditorOptions } from '../../../utils/editorOptimization'
import {
	calculateElementScale,
	calculateScaleWithViewport,
	ScaleInfo,
} from '../../../utils/scaleCalculator'

import styles from './EditorComponent.module.css'
import buttonStyles from '../../shared/Button/Button.module.css'

import { useCaretAnimation, useIMEFloat, useLineDecorations } from './components'
import { Counter } from './components/Counter/Counter'
import { usePerformanceMonitor } from '../../hooks/usePerformanceMonitor'

type Props = {
	textData: string
	extended: boolean
	settings: EditorSettings
	isDragging?: boolean
	isMaximized: boolean
	onChange: (v: string) => void
	onMaximize: () => void
	onFocusPane: () => void
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
}: Props) => {
	// パフォーマンス監視
	const performanceMonitor = usePerformanceMonitor('EditorComponent')

	const containerRef = useRef<HTMLDivElement>(null)
	const editorRef = useRef<monaco.editor.IStandaloneCodeEditor | null>(null)
	const wrapperRef = useRef<HTMLDivElement>(null) // エディタ全体のWrapper
	const isInnerFocusRef = useRef(false) // エディタ内部フォーカス状態
	const imeCompositionRef = useRef(false) // IME入力中フラグ
	// IME入力中の未確定文字を保持するref
	const imeCompositionTextRef = useRef<string>('')
	// IME開始時のエディタ状態を保存するref
	const imeStartValueRef = useRef<string>('')
	const imeStartPositionRef = useRef<monaco.IPosition | null>(null)
	const imeStartSelectionRef = useRef<monaco.ISelection | null>(null)

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

	// 分離されたコンポーネントを使用
	const { triggerCaretAnimation, addCaretAnimationStyles, createRippleEffect } = useCaretAnimation({
		editorRef,
		containerRef,
		fontSize,
		textColor,
		enabled: true,
	})

	const { createIMEFloat, updateIMEFloatContent, removeIMEFloat } = useIMEFloat({
		containerRef,
		editorRef,
		fontSize,
		fontFamily,
		backgroundColor,
		textColor,
		enabled: true,
	})

	const { addLineDecorations } = useLineDecorations({
		editorRef,
		textColor,
		enabled: true,
	})

	// 倍率計算のロジック
	const updateScaleInfo = useCallback(() => {
		if (containerRef.current) {
			const newScaleInfo = calculateScaleWithViewport(containerRef.current)
			setScaleInfo(newScaleInfo)

			console.log('[EditorComponent] Scale info updated:', {
				element: 'Editor',
				...newScaleInfo,
			})
		}
	}, [])

	// ResizeObserverのデバウンス処理
	const resizeTimeoutRef = useRef<NodeJS.Timeout>()
	const debouncedUpdateScaleInfo = useCallback(() => {
		if (resizeTimeoutRef.current) {
			clearTimeout(resizeTimeoutRef.current)
		}
		resizeTimeoutRef.current = setTimeout(() => {
			updateScaleInfo()
		}, 100) // 100msのデバウンス
	}, [updateScaleInfo])

	// 倍率計算の初期化と監視
	useEffect(() => {
		// 初期倍率を計算
		updateScaleInfo()

		// ResizeObserverでサイズ変更を監視（デバウンス処理付き）
		if (containerRef.current) {
			const resizeObserver = new ResizeObserver(() => {
				debouncedUpdateScaleInfo()
			})

			resizeObserver.observe(containerRef.current)

			return () => {
				resizeObserver.disconnect()
				if (resizeTimeoutRef.current) {
					clearTimeout(resizeTimeoutRef.current)
				}
			}
		}
	}, [updateScaleInfo, debouncedUpdateScaleInfo])

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

	// Monaco Editorの自動折り返し設定を更新する関数
	const updateWordWrapColumn = useCallback(() => {
		if (!editorRef.current) return

		const editor = editorRef.current
		const currentWordWrapColumn = wordWrapColumn || DEFAULT_SETTING.editor.wordWrapColumn

		if (imeCompositionRef.current) {
			// IME入力中：wordWrapを無効にして要素の呼び出しを許可
		} else {
			// 通常時：ソフトラップ有効 + 日本語禁則処理適用
			editor.updateOptions({
				wordWrap: 'wordWrapColumn' as const,
				wordWrapColumn: currentWordWrapColumn,
				// 日本語禁則処理：空文字列でデフォルト動作を使用
				wordWrapBreakAfterCharacters: '',
				wordWrapBreakBeforeCharacters: '',
			})
		}
	}, [wordWrapColumn])

	// エディタの設定オブジェクトをメモ化（最適化版）
	const editorOptions = useMemo(() => {
		const baseOptions = {
			language: 'plaintext' as const,
			fontSize,
			wordWrapColumn,
			fontFamily,
			wordWrap: 'wordWrapColumn' as const, // 指定文字数で自動折り返し（ソフトラップ）
			// 日本語文字での厳密な折り返しのため、区切り文字を制限
			wordWrapBreakAfterCharacters: '',
			wordWrapBreakBeforeCharacters: '',
			wordWrapBreakObtrusiveCharacters: '',
			// IME入力制御
			accessibilitySupport: 'off' as const, // IME入力の自動制御を無効化
			renderFinalNewline: 'off' as const,
			minimap: { enabled: false },
			tabFocusMode: false, // 外部でフォーカス制御するため無効化
			tabSize: 1,
			scrollbar: {
				vertical: 'hidden' as const,
				horizontal: 'visible' as const,
				verticalScrollbarSize: 2,
				horizontalScrollbarSize: 0,
			},
			// 視認性向上の設定
			lineHeight: fontSize * 1.5, // 行間を広げて読みやすく
			letterSpacing: 0.5, // 文字間隔を調整
			cursorWidth: 2, // カーソルを太くして見やすく
			cursorBlinking: 'smooth' as const, // カーソルの点滅をスムーズに
			renderWhitespace: 'boundary' as const, // 空白文字を境界のみ表示
			renderLineHighlight: 'all' as const, // 現在行のハイライトを全体に
			lineNumbers: 'on' as const, // 行番号を表示
			lineNumbersMinChars: 3, // 行番号の最小桁数
			glyphMargin: false, // グリフマージンを無効（シンプルに）
			folding: false, // 折りたたみ機能を無効（プレーンテキスト用）
			links: false, // リンク検出を無効
			colorDecorators: false, // カラーデコレータを無効
			hideCursorInOverviewRuler: false, // オーバービューでカーソル表示
			overviewRulerBorder: false, // オーバービューの境界線を無効
			renderControlCharacters: false, // 制御文字を非表
		}

		return getOptimizedEditorOptions(baseOptions)
	}, [fontSize, wordWrapColumn, fontFamily])

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

	// コールバック関数をメモ化
	const handleMaximize = useCallback(() => {
		onMaximize()
	}, [onMaximize])

	const handleFocusPane = useCallback(() => {
		onFocusPane()

		// フォーカス時にエディタのレイアウトを再計算
		if (editorRef.current) {
			setTimeout(() => {
				if (editorRef.current) {
					editorRef.current.layout()
				}
			}, 50)
		}
	}, [onFocusPane])

	// 禁則処理用の文字判定関数
	const applyKinsokuToEditor = useCallback(() => {
		if (!editorRef.current) return

		const editor = editorRef.current

		// 禁則処理のテスト：まずは空文字列で試す
		const kinsokuOptions = {
			// 空文字列でMonaco Editorのデフォルト動作を確認
			wordWrapBreakAfterCharacters: '',
			wordWrapBreakBeforeCharacters: '',
		}

		// エディタの設定を更新
		editor.updateOptions(kinsokuOptions)
	}, [])

	// エディタの初期化（設定変更時のみ再作成）
	useEffect(() => {
		if (!containerRef.current) return

		// 既存のエディタがあれば破棄
		if (editorRef.current) {
			editorRef.current.dispose()
			editorRef.current = null
		}

		// カスタムテーマを定義（視認性向上）
		monaco.editor.defineTheme('custom-theme', {
			base: 'vs',
			inherit: true,
			rules: [],
			colors: {
				'editor.background': backgroundColor,
				'editor.foreground': textColor,
				// 現在行のハイライト（背景色より少し明るく/暗く）
				'editor.lineHighlightBackground':
					backgroundColor === '#ffffff'
						? '#f8f8f8' // 白背景の場合は薄いグレー
						: backgroundColor === '#000000'
							? '#1a1a1a' // 黒背景の場合は薄い黒
							: `${backgroundColor}20`, // その他の場合は透明度付き
				// 行番号の色（テキスト色より少し薄く）
				'editorLineNumber.foreground': textColor + '80', // 50%透明度
				'editorLineNumber.activeForeground': textColor, // アクティブ行番号は通常色
				// カーソルの色（テキスト色と同じ）
				'editorCursor.foreground': textColor,
				// 選択範囲の背景色
				'editor.selectionBackground': textColor + '30', // 19%透明度
				'editor.selectionHighlightBackground': textColor + '20', // 12%透明度
				// 単語選択時のハイライト
				'editor.wordHighlightBackground': textColor + '15', // 8%透明度
				'editor.wordHighlightStrongBackground': textColor + '25', // 15%透明度
				// 検索時のハイライト
				'editor.findMatchBackground': textColor + '40', // 25%透明度
				'editor.findMatchHighlightBackground': textColor + '20', // 12%透明度
				// インデントガイドの色
				'editorIndentGuide.background': textColor + '20', // 12%透明度
				'editorIndentGuide.activeBackground': textColor + '40', // 25%透明度
				// ホワイトスペース文字の色
				'editorWhitespace.foreground': textColor + '30', // 19%透明度
				// IME入力時の未確定文字スタイル
				'editorSuggestWidget.background': backgroundColor,
				'editorSuggestWidget.border': textColor + '20',
				'editorSuggestWidget.foreground': textColor,
				// 未確定文字の下線色（IME入力時）
				'editorBracketMatch.background': 'transparent',
				'editorBracketMatch.border': 'transparent',
			},
		})

		const editor = monaco.editor.create(containerRef.current, {
			...editorOptions,
			value: textData, // 初期値を設定
			theme: 'custom-theme',
			language: 'plaintext', // 言語を明示的に設定
			// モバイル対応の設定
			automaticLayout: true, // レイアウトの自動調整
			quickSuggestions: false, // クイック提案を無効（モバイルで邪魔になる場合）
			wordBasedSuggestions: 'off', // 正しい型を使用
			parameterHints: { enabled: false },
			codeLens: false,
			contextmenu: true, // コンテキストメニューを無効（長押しとの競合防止）
			mouseWheelZoom: false, // マウスホイールズームを無効
		})
		editorRef.current = editor

		// Monaco Editor内でのTabキー処理を設定
		editor.addCommand(monaco.KeyCode.Tab, () => {
			if (isInnerFocusRef.current) {
				// 内部フォーカス時はTab文字を挿入
				editor.trigger('keyboard', 'type', { text: '\t' })
				return true
			} else {
				// 外部フォーカス時はTab文字挿入を無効化
				return false
			}
		})

		// Shift+Tab でアウトデント（内部フォーカス時のみ）
		editor.addCommand(monaco.KeyMod.Shift | monaco.KeyCode.Tab, () => {
			if (isInnerFocusRef.current) {
				editor.trigger('keyboard', 'editor.action.outdentLines', {})
				return true
			} else {
				return false
			}
		})

		// フォントファミリーを初期設定で適用
		setTimeout(() => {
			const editorContainer = containerRef.current
			if (editorContainer) {
				// Monaco Editor全体にフォントファミリーを適用
				const editorElement = editorContainer.querySelector('.monaco-editor') as HTMLElement
				if (editorElement) {
					editorElement.style.fontFamily = fontFamily
				}

				// テキストエリアにも直接適用
				const textareas = editorContainer.querySelectorAll('textarea')
				textareas.forEach(textarea => {
					;(textarea as HTMLElement).style.fontFamily = fontFamily
				})

				// view-lineクラスの要素にも適用
				const viewLines = editorContainer.querySelectorAll('.view-line')
				viewLines.forEach(line => {
					;(line as HTMLElement).style.fontFamily = fontFamily
				})
			}
		}, 100) // Monaco Editorの初期化を待つ

		// 現在行のワードラップ制御
		let currentLineStyle: HTMLStyleElement | null = null

		const updateCurrentLineWrap = () => {
			const position = editor.getPosition()
			if (!position) return

			// 既存のスタイルを削除
			if (currentLineStyle) {
				currentLineStyle.remove()
				currentLineStyle = null
			}

			// 現在行のスタイルを動的に追加
			currentLineStyle = document.createElement('style')
			currentLineStyle.textContent = `
				.monaco-editor .view-line:nth-child(${position.lineNumber}) {
					white-space: nowrap !important;
					overflow-x: visible !important;
				}
				.monaco-editor .view-line:nth-child(${position.lineNumber}) > span {
					white-space: nowrap !important;
				}
			`
			document.head.appendChild(currentLineStyle)
		}

		// クリーンアップ関数
		const cleanupCurrentLineStyle = () => {
			if (currentLineStyle) {
				currentLineStyle.remove()
				currentLineStyle = null
			}
		}

		// onChangeイベントを追加
		const disposable = editor.onDidChangeModelContent(() => {
			const currentValue = editor.getValue()

			// IME入力中は状態更新を抑制
			if (imeCompositionRef.current) {
				return
			}

			// 初期値と異なる場合のみonChangeを呼び出し
			if (currentValue !== textData) {
				handleChange(currentValue)
			}

			// ソフトラップ設定を更新
			updateWordWrapColumn()

			// 行デコレーションを更新
			setTimeout(() => {
				addLineDecorations()
			}, 100)
		})

		// カーソル位置変更時の制御
		const cursorDisposable = editor.onDidChangeCursorPosition(() => {
			// IME入力中はカーソル移動を元の位置に戻す
			if (imeCompositionRef.current && imeStartPositionRef.current) {
				const currentPosition = editor.getPosition()
				const startPosition = imeStartPositionRef.current

				// カーソルが元の位置と異なる場合、元の位置に戻す
				if (
					currentPosition &&
					(currentPosition.lineNumber !== startPosition.lineNumber ||
						currentPosition.column !== startPosition.column)
				) {
					editor.setPosition(startPosition)
					return
				}
			}

			// ソフトラップ設定を更新
			updateWordWrapColumn()
		})

		// IMEイベントハンドラーを追加
		const setupIMEHandlers = () => {
			const textArea = containerRef.current?.querySelector('textarea')
			if (textArea) {
				// IME関連のイベントハンドラー
				const handleBeforeInput = (e: Event) => {
					// IME入力中はbeforeinputイベントを無効化
					if (imeCompositionRef.current) {
						e.preventDefault()
						e.stopPropagation()
						return false
					}
				}

				const handleInput = (e: Event) => {
					// IME入力中はinputイベントを無効化
					if (imeCompositionRef.current) {
						e.preventDefault()
						e.stopPropagation()
						return false
					}
				}
				const handleCompositionStart = () => {
					imeCompositionRef.current = true
					imeCompositionTextRef.current = ''

					if (editorRef.current) {
						// IME開始時のエディタ状態を保存
						imeStartValueRef.current = editorRef.current.getValue()
						imeStartPositionRef.current = editorRef.current.getPosition()
						imeStartSelectionRef.current = editorRef.current.getSelection()
					}

					// IME開始時にwordWrapを無効化
					updateWordWrapColumn()
					// IMEフロート要素を作成（常時表示）
					createIMEFloat()
				}

				const handleCompositionUpdate = (e: CompositionEvent) => {
					if (imeCompositionRef.current && editorRef.current) {
						imeCompositionTextRef.current = e.data || ''

						// エディタの内容を元の状態に強制復元（IME入力中は反映させない）
						const currentValue = editorRef.current.getValue()
						if (currentValue !== imeStartValueRef.current) {
							editorRef.current.setValue(imeStartValueRef.current)
						}

						// カーソル位置を固定
						if (imeStartPositionRef.current) {
							editorRef.current.setPosition(imeStartPositionRef.current)
						}

						// IME入力中の文字をフロート内容更新
						updateIMEFloatContent(imeCompositionTextRef.current)
					}
				}

				const handleCompositionEnd = (e: CompositionEvent) => {
					const finalText = e.data || ''

					// フロート表示を削除
					removeIMEFloat()

					if (editorRef.current && imeStartPositionRef.current) {
						// エディタを元の状態に戻す
						editorRef.current.setValue(imeStartValueRef.current)
						editorRef.current.setPosition(imeStartPositionRef.current)

						// 確定文字を挿入
						if (finalText) {
							const position = imeStartPositionRef.current
							const model = editorRef.current.getModel()

							if (model) {
								// 現在の行内容を取得
								const lineContent = model.getLineContent(position.lineNumber)
								const beforeCursor = lineContent.substring(0, position.column - 1)
								const afterCursor = lineContent.substring(position.column - 1)

								// 新しい行内容を作成（確定文字を挿入）
								const newLineContent = beforeCursor + finalText + afterCursor

								// 行全体を置換
								const range = {
									startLineNumber: position.lineNumber,
									startColumn: 1,
									endLineNumber: position.lineNumber,
									endColumn: lineContent.length + 1,
								}

								editorRef.current.executeEdits('ime-insert', [
									{
										range: range,
										text: newLineContent,
									},
								])

								// キャレット位置を確定文字の後に設定
								setTimeout(() => {
									if (editorRef.current) {
										const textLength = finalText.length
										const newPosition = {
											lineNumber: position.lineNumber,
											column: position.column + textLength,
										}

										// 強制的にキャレット位置を設定
										editorRef.current.setPosition(newPosition)
										editorRef.current.revealPosition(newPosition)
										editorRef.current.focus()

										// キャレット移動アニメーションを実行（波紋なし）
										setTimeout(() => {
											triggerCaretAnimation('pulse', false)
										}, 100)
									}
								}, 50)
							}
						}
					}

					// IME状態をリセット
					imeCompositionRef.current = false
					imeCompositionTextRef.current = ''
					imeStartValueRef.current = ''
					imeStartPositionRef.current = null
					imeStartSelectionRef.current = null

					// IME入力完了後の処理
					setTimeout(() => {
						if (editorRef.current) {
							// IME終了時にwordWrapを再有効化
							updateWordWrapColumn()
							// 状態更新
							const currentValue = editorRef.current.getValue()
							if (currentValue !== textData) {
								handleChange(currentValue)
							}
						}
					}, 100)
				}

				textArea.addEventListener('beforeinput', handleBeforeInput, true) // キャプチャフェーズで実行
				textArea.addEventListener('compositionstart', handleCompositionStart)
				textArea.addEventListener('compositionupdate', handleCompositionUpdate)
				textArea.addEventListener('compositionend', handleCompositionEnd)
				textArea.addEventListener('input', handleInput, true) // キャプチャフェーズで実行

				return () => {
					textArea.removeEventListener('beforeinput', handleBeforeInput, true)
					textArea.removeEventListener('compositionstart', handleCompositionStart)
					textArea.removeEventListener('compositionupdate', handleCompositionUpdate)
					textArea.removeEventListener('compositionend', handleCompositionEnd)
					textArea.removeEventListener('input', handleInput, true)
				}
			}
			return () => {}
		}

		// Monaco Editorのフォーカスイベント監視
		const focusDisposable = editor.onDidFocusEditorText(() => {
			isInnerFocusRef.current = true
			if (wrapperRef.current) {
				wrapperRef.current.setAttribute('data-inner-focus', 'true')
			}
		})

		const blurDisposable = editor.onDidBlurEditorText(() => {
			// エディタからフォーカスが外れた時の処理
			// Tabキーによる移動の場合は、外部フォーカスを維持せずに次の要素へ移動
			setTimeout(() => {
				if (isInnerFocusRef.current && document.activeElement !== wrapperRef.current) {
					// エディタ外の要素にフォーカスが移った場合は、内部フォーカス状態をリセット
					isInnerFocusRef.current = false
					if (wrapperRef.current) {
						wrapperRef.current.setAttribute('data-inner-focus', 'false')
					}
				}
			}, 0)
		})

		// IMEハンドラーをセットアップ（少し遅延してDOMの準備を待つ）
		let imeCleanupFn: (() => void) | null = null
		const imeTimer = setTimeout(() => {
			imeCleanupFn = setupIMEHandlers()
		}, 100)

		// Ctrlキー押下時のキャレットアニメーション
		const handleKeyDown = (e: KeyboardEvent) => {
			if (e.key === 'Control' && !e.repeat) {
				// キャレットにフォーカスがある場合のみアニメーションを実行
				if (editorRef.current && document.activeElement?.closest('.monaco-editor')) {
					triggerCaretAnimation('pulse', true) // 波紋効果も有効
				}
			}
		}

		// グローバルキーイベントリスナーを追加
		document.addEventListener('keydown', handleKeyDown)

		// エディタのレイアウトを強制的に計算
		setTimeout(() => {
			if (editorRef.current) {
				editorRef.current.layout()
				// 行デコレーションを追加
				addLineDecorations()
				// キャレットアニメーションスタイルを追加
				addCaretAnimationStyles()
			}
		}, 0)

		return () => {
			disposable.dispose()
			cursorDisposable.dispose()
			focusDisposable.dispose()
			blurDisposable.dispose()
			cleanupCurrentLineStyle()
			clearTimeout(imeTimer)
			if (imeCleanupFn) {
				imeCleanupFn()
			}

			// キーイベントリスナーを削除
			document.removeEventListener('keydown', handleKeyDown)

			// IMEフロート要素をクリーンアップ
			removeIMEFloat()

			editor.dispose()
			editorRef.current = null
		}
	}, [
		editorOptions,
		extended,
		backgroundColor,
		textColor,
		fontFamily,
		addLineDecorations,
		addCaretAnimationStyles,
		triggerCaretAnimation,
		createRippleEffect,
		removeIMEFloat,
	]) // テーマ設定も依存関係に追加

	// fontSize,fontFamily変化時にエディタ更新
	useEffect(() => {
		if (!editorRef.current) return

		// IME入力中は更新を抑制
		if (imeCompositionRef.current) {
			return
		}

		// Monaco Editorのオプション更新
		editorRef.current.updateOptions({
			fontSize,
			lineHeight: cellSize,
		})

		// フォントファミリーをCSSで直接適用
		const editorContainer = containerRef.current
		if (editorContainer) {
			// Monaco Editor全体にフォントファミリーを適用
			const editorElement = editorContainer.querySelector('.monaco-editor') as HTMLElement
			if (editorElement) {
				editorElement.style.fontFamily = fontFamily
			}

			// テキストエリアにも直接適用
			const textareas = editorContainer.querySelectorAll('textarea')
			textareas.forEach(textarea => {
				;(textarea as HTMLElement).style.fontFamily = fontFamily
			})

			// view-lineクラスの要素にも適用
			const viewLines = editorContainer.querySelectorAll('.view-line')
			viewLines.forEach(line => {
				;(line as HTMLElement).style.fontFamily = fontFamily
			})
		}
	}, [fontSize, fontFamily, cellSize])

	// wordWrapColumn変更時にエディタの折り返し設定を更新
	useEffect(() => {
		if (!editorRef.current) return

		// IME入力中は設定変更を抑制（IME完了後に自動適用される）
		if (imeCompositionRef.current) {
			return
		}

		updateWordWrapColumn()
	}, [wordWrapColumn, updateWordWrapColumn])

	// ドラッグ状態の変更時にエディタのサイズを調整
	useEffect(() => {
		if (!editorRef.current) return

		// IME入力中は更新を抑制
		if (imeCompositionRef.current) {
			return
		}

		// ドラッグ終了後にエディタのサイズを再計算
		if (!isDragging) {
			// 少し遅延させてレイアウトの安定化を待つ
			setTimeout(() => {
				if (editorRef.current) {
					editorRef.current.layout()
				}
			}, 100)
		}
	}, [isDragging])

	// ResizeObserverでコンテナサイズ変更を監視
	useEffect(() => {
		if (!containerRef.current) return

		const resizeObserver = new ResizeObserver(entries => {
			// IME入力中はレイアウト更新を抑制
			if (imeCompositionRef.current) {
				return
			}

			for (const entry of entries) {
				const { width, height } = entry.contentRect

				if (editorRef.current) {
					// 明示的にサイズを指定してレイアウト再計算
					editorRef.current.layout({
						width: Math.floor(width),
						height: Math.floor(height),
					})
				}
			}
		})

		const currentContainer = containerRef.current
		resizeObserver.observe(currentContainer)

		return () => {
			resizeObserver.disconnect()
		}
	}, [editorOptions, extended, backgroundColor, textColor, fontFamily]) // エディター再作成時に再設定

	// ウィンドウリサイズイベントの監視（フォールバック）
	useEffect(() => {
		const handleResize = () => {
			// IME入力中は更新を抑制
			if (imeCompositionRef.current) {
				return
			}

			if (editorRef.current) {
				// 少し遅延してDOMの更新を待つ
				setTimeout(() => {
					if (editorRef.current) {
						editorRef.current.layout()
					}
				}, 50)
			}
		}

		window.addEventListener('resize', handleResize)
		return () => window.removeEventListener('resize', handleResize)
	}, [])

	// value変化時にエディタの内容を更新（カーソル位置保持版）
	useEffect(() => {
		if (!editorRef.current) return
		const currentValue = editorRef.current.getValue()

		// IME入力中は外部更新を抑制
		if (imeCompositionRef.current) {
			return
		}
		// エディタの内容と異なる場合のみ更新（無限ループを防ぐ）
		if (currentValue !== textData) {
			const editor = editorRef.current
			const model = editor.getModel()
			if (model) {
				// カーソル位置を保存
			const position = editor.getPosition()
			const selection = editor.getSelection()

				// 少しの差分であれば編集操作を使用（カーソル位置が保持される）
				const lengthDiff = Math.abs(currentValue.length - textData.length)
				if (lengthDiff < 100 && position) {
					// 編集操作でテキストを置換（カーソル位置が自動的に調整される）
					const range = model.getFullModelRange()
					editor.executeEdits('external-update', [
						{
							range: range,
							text: textData,
						},
					])
				} else {
					// 大きな変更の場合は setValue を使用し、位置を復元
			model.setValue(textData)

					// カーソル位置を復元（位置が有効な範囲内の場合のみ）
					if (position) {
						// 次のフレームで実行してレンダリング完了を待つ
						setTimeout(() => {
							if (editorRef.current) {
				const lineCount = model.getLineCount()
								const maxLine = Math.min(position.lineNumber, lineCount)
								const lineLength = model.getLineLength(maxLine)
								const maxColumn = Math.min(position.column, lineLength + 1)

								const newPosition = { lineNumber: maxLine, column: maxColumn }
								editorRef.current.setPosition(newPosition)

								// 選択範囲も復元（可能な場合）
								if (selection) {
									const startLine = Math.min(selection.startLineNumber, lineCount)
									const endLine = Math.min(selection.endLineNumber, lineCount)
									const startLineLength = model.getLineLength(startLine)
									const endLineLength = model.getLineLength(endLine)

									const newSelection = {
										startLineNumber: startLine,
										startColumn: Math.min(selection.startColumn, startLineLength + 1),
										endLineNumber: endLine,
										endColumn: Math.min(selection.endColumn, endLineLength + 1),
									}
									editorRef.current.setSelection(newSelection)
								}
							}
						}, 0)
					}
				}
			}
		}
	}, [textData])

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
					className="monaco-editor-container"
					style={{
						...containerStyle,
						touchAction: 'auto', // Monaco Editorのタッチ操作を有効にする
						userSelect: 'text', // Monaco Editor内でのテキスト選択を明示的に有効
						WebkitUserSelect: 'text', // Webkit系ブラウザ対応
					}}
				/>

					<div id="editor-instructions" className={styles.instructions}>
						<p>Enterキーで編集開始 • Escapeキーで編集終了 • Ctrl+Tabでフォーカス移動</p>
					</div>
				</div>
				<div className={styles.counterInfoBar} role="status" aria-live="polite">
					<Counter text={textData} />
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
