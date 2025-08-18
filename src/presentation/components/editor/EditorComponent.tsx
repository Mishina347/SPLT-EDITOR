import * as monaco from 'monaco-editor'
import { useCallback, useEffect, useMemo, useRef } from 'react'
import { EditorSettings } from '../../../domain'

import styles from './EditorComponent.module.css'
import buttonStyles from '../../shared/Button.module.css'

type Props = {
	textData: string
	extended: boolean
	settings: EditorSettings
	isDragging?: boolean
	currentEditorSize: number
	isMaximized: boolean
	onChange: (v: string) => void
	onMaximize: () => void
	onFocusPane: () => void
}

/**
 * 背景の正方形マス目を描画
 */
function updateGridCSS(cellSize: number) {
	const sizePx = `${cellSize}px`
	const styleId = 'monaco-grid-style'
	let styleTag = document.getElementById(styleId) as HTMLStyleElement | null

	if (!styleTag) {
		styleTag = document.createElement('style')
		styleTag.id = styleId
		document.head.appendChild(styleTag)
	}

	styleTag.innerHTML = `
    .monaco-editor .view-line {
      background-image: 
        linear-gradient(to right, rgba(0,0,0,0.2) 1px, transparent 1px),
        linear-gradient(to bottom, rgba(0,0,0,0.2) 1px, transparent 1px);
      background-size: ${sizePx} ${sizePx};
    }
  `
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
	const containerRef = useRef<HTMLDivElement>(null)
	const editorRef = useRef<monaco.editor.IStandaloneCodeEditor | null>(null)

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

	// エディタの設定オブジェクトをメモ化（valueは除外）
	const editorOptions = useMemo(
		() => ({
			language: 'plaintext' as const,
			fontSize,
			wordWrapColumn,
			fontFamily,
			wordWrap: 'wordWrapColumn' as const,
			minimap: { enabled: false },
			tabFocusMode: false,
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
			smoothScrolling: true, // スムーズスクロール
			lineNumbers: 'on' as const, // 行番号を表示
			lineNumbersMinChars: 3, // 行番号の最小桁数
			glyphMargin: false, // グリフマージンを無効（シンプルに）
			folding: false, // 折りたたみ機能を無効（プレーンテキスト用）
			links: false, // リンク検出を無効
			colorDecorators: false, // カラーデコレータを無効
			hideCursorInOverviewRuler: false, // オーバービューでカーソル表示
			overviewRulerBorder: false, // オーバービューの境界線を無効
			renderControlCharacters: false, // 制御文字を非表示
			renderFinalNewline: 'on' as const, // 最終行の改行を表示
		}),
		[fontSize, wordWrapColumn, fontFamily]
	)

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

	// onChangeコールバックを安定化
	const handleChange = useCallback(
		(newValue: string) => {
			onChange(newValue)
		},
		[onChange]
	)

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
			},
		})

		const editor = monaco.editor.create(containerRef.current, {
			...editorOptions,
			value: textData, // 初期値を設定
			theme: 'custom-theme',
			// モバイル対応の設定
			acceptSuggestionOnEnter: 'off', // モバイルでの誤動作を防ぐ
			acceptSuggestionOnCommitCharacter: false,
			automaticLayout: true, // レイアウトの自動調整
			quickSuggestions: false, // クイック提案を無効（モバイルで邪魔になる場合）
			wordBasedSuggestions: 'off', // 正しい型を使用
			parameterHints: { enabled: false },
			codeLens: false,
			contextmenu: true, // コンテキストメニューを無効（長押しとの競合防止）
			mouseWheelZoom: false, // マウスホイールズームを無効
		})
		editorRef.current = editor

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

		// onChangeイベントを追加
		const disposable = editor.onDidChangeModelContent(() => {
			const currentValue = editor.getValue()
			// 初期値と異なる場合のみonChangeを呼び出し
			if (currentValue !== textData) {
				handleChange(currentValue)
			}
		})

		// エディタのレイアウトを強制的に計算
		setTimeout(() => {
			if (editorRef.current) {
				editorRef.current.layout()
			}
		}, 0)

		return () => {
			disposable.dispose()
			editor.dispose()
			editorRef.current = null
		}
	}, [editorOptions, extended, backgroundColor, textColor, fontFamily]) // テーマ設定も依存関係に追加

	// fontSize,fontFamily変化時にエディタ更新
	useEffect(() => {
		if (!editorRef.current) return

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

	// ドラッグ状態の変更時にエディタのサイズを調整
	useEffect(() => {
		if (!editorRef.current) return

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

	// value変化時にエディタの内容を更新（外部からの変更のみ）
	useEffect(() => {
		if (!editorRef.current) return
		const currentValue = editorRef.current.getValue()
		// エディタの内容と異なる場合のみ更新（無限ループを防ぐ）
		if (currentValue !== textData) {
			// 直接モデルに値を設定（onChangeイベントは発生しない）
			const model = editorRef.current.getModel()
			if (model) {
				model.setValue(textData)
			}
		}
	}, [textData])

	return (
		<>
			<main className={styles.editorBody} onFocus={handleFocusPane}>
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
			</main>
			<button
				className={`${buttonStyles.maximizeBtn} ${styles.maximizeBtnPosition} 
					${isMaximized ? buttonStyles.buttonActive : buttonStyles.buttonSecondary}
				`}
				aria-pressed={isMaximized ? 'true' : 'false'}
				onClick={e => {
					e.preventDefault()
					e.stopPropagation() // 長押しリサイズとの競合を防ぐ
					handleMaximize()
				}}
				onTouchEnd={e => {
					console.log('Editor maximize button touch end')
					e.preventDefault()
					e.stopPropagation() // 長押しリサイズとの競合を防ぐ
					handleMaximize()
				}}
				style={{
					touchAction: 'manipulation',
					WebkitTapHighlightColor: 'rgba(0,0,0,0)',
					zIndex: 1001, // 長押しリサイズエリアより上に配置
				}}
			>
				⛶
			</button>
		</>
	)
}
