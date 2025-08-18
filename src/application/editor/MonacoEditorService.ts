import * as monaco from 'monaco-editor'
import { FontFamily } from '../../domain'

export interface MonacoThemeConfig {
	backgroundColor: string
	textColor: string
}

export interface MonacoEditorConfig {
	fontSize: number
	wordWrapColumn: number
	fontFamily: FontFamily
	theme: MonacoThemeConfig
}

export class MonacoEditorService {
	private static instance: MonacoEditorService
	private customThemes: Map<string, string> = new Map()
	private themeCache: Map<string, monaco.editor.IStandaloneThemeData> = new Map()
	private cssCache: Map<number, string> = new Map()

	static getInstance(): MonacoEditorService {
		if (!MonacoEditorService.instance) {
			MonacoEditorService.instance = new MonacoEditorService()
		}
		return MonacoEditorService.instance
	}

	/**
	 * Monacoエディタのオプションを生成
	 */
	generateEditorOptions(
		config: MonacoEditorConfig
	): monaco.editor.IStandaloneEditorConstructionOptions {
		const { fontSize, wordWrapColumn, fontFamily } = config

		return {
			value: '',
			language: 'plaintext',
			theme: 'custom-theme',
			fontSize,
			fontFamily,
			wordWrap: 'wordWrapColumn',
			wordWrapColumn,
			rulers: [wordWrapColumn],
			automaticLayout: true,
			scrollBeyondLastLine: false,
			minimap: { enabled: false },
			lineNumbers: 'on',
			lineNumbersMinChars: 3,
			glyphMargin: false,
			folding: false,
			links: false,
			colorDecorators: false,
			hideCursorInOverviewRuler: false,
			overviewRulerBorder: false,
			renderControlCharacters: false,
			renderFinalNewline: 'on' as const,
		}
	}

	/**
	 * カスタムテーマを生成・登録（キャッシュ付き）
	 */
	createCustomTheme(themeId: string, config: MonacoThemeConfig): string {
		const { backgroundColor, textColor } = config
		const cacheKey = `${backgroundColor}_${textColor}`

		// キャッシュから取得
		let themeData = this.themeCache.get(cacheKey)

		if (!themeData) {
			// 新しいテーマデータを生成
			themeData = {
				base: 'vs',
				inherit: true,
				rules: [],
				colors: {
					'editor.background': backgroundColor,
					'editor.foreground': textColor,
					'editor.lineHighlightBackground': this.generateLineHighlightColor(backgroundColor),
					'editorLineNumber.foreground': this.generateLineNumberColor(textColor),
					'editorLineNumber.activeForeground': textColor,
					'editor.selectionBackground': this.generateSelectionColor(textColor),
					'editor.inactiveSelectionBackground': this.generateInactiveSelectionColor(textColor),
					'editorCursor.foreground': textColor,
					'editorWhitespace.foreground': this.generateWhitespaceColor(textColor),
					'editorRuler.foreground': this.generateRulerColor(backgroundColor),
				},
			}

			// キャッシュに保存
			this.themeCache.set(cacheKey, themeData)
		}

		// テーマを定義（既に定義済みの場合はスキップ）
		if (!this.customThemes.has(themeId)) {
			monaco.editor.defineTheme(themeId, themeData)
			this.customThemes.set(themeId, cacheKey)
		}

		return themeId
	}

	/**
	 * グリッドCSSを更新（文字サイズに基づく、キャッシュ付き）
	 */
	updateGridCSS(fontSize: number): void {
		// キャッシュから取得
		let css = this.cssCache.get(fontSize)

		if (!css) {
			const cellSize = Math.ceil(fontSize * 0.6) // フォントサイズに比例したセルサイズ
			const sizePx = `${cellSize}px`

			css = `
				.monaco-editor .view-lines .view-line > span > span {
					background-image:
						linear-gradient(to right, #e0e0e050 1px, transparent 1px),
						linear-gradient(to bottom, #e0e0e050 1px, transparent 1px);
					background-size: ${sizePx} ${sizePx};
				}
			`

			// キャッシュに保存
			this.cssCache.set(fontSize, css)
		}

		// DOMの更新をスケジュール化
		this.updateStyleElement(css)
	}

	/**
	 * スタイル要素の効率的な更新
	 */
	private updateStyleElement(css: string): void {
		let existingStyle = document.getElementById('monaco-grid-style') as HTMLStyleElement

		if (!existingStyle) {
			existingStyle = document.createElement('style')
			existingStyle.id = 'monaco-grid-style'
			document.head.appendChild(existingStyle)
		}

		// 内容が変わっている場合のみ更新
		if (existingStyle.textContent !== css) {
			existingStyle.textContent = css
		}
	}

	/**
	 * エディタインスタンスを作成
	 */
	createEditor(
		container: HTMLElement,
		config: MonacoEditorConfig,
		initialValue: string = ''
	): monaco.editor.IStandaloneCodeEditor {
		// カスタムテーマを作成
		this.createCustomTheme('custom-theme', config.theme)

		// グリッドCSSを更新
		this.updateGridCSS(config.fontSize)

		// エディタオプションを生成
		const options = this.generateEditorOptions(config)
		options.value = initialValue

		return monaco.editor.create(container, options)
	}

	/**
	 * エディタの設定を更新
	 */
	updateEditorConfig(editor: monaco.editor.IStandaloneCodeEditor, config: MonacoEditorConfig): void {
		// テーマを更新
		this.createCustomTheme('custom-theme', config.theme)
		editor.updateOptions({ theme: 'custom-theme' })

		// その他のオプションを更新
		editor.updateOptions({
			fontSize: config.fontSize,
			fontFamily: config.fontFamily,
			wordWrapColumn: config.wordWrapColumn,
			rulers: [config.wordWrapColumn],
		})

		// グリッドCSSを更新
		this.updateGridCSS(config.fontSize)
	}

	// プライベートメソッド：色の計算
	private generateLineHighlightColor(backgroundColor: string): string {
		return backgroundColor === '#ffffff' ? '#f8f8f8' : '#2d2d2d'
	}

	private generateLineNumberColor(textColor: string): string {
		return textColor === '#000000' ? '#858585' : '#858585'
	}

	private generateSelectionColor(textColor: string): string {
		return textColor === '#000000' ? '#add6ff' : '#264f78'
	}

	private generateInactiveSelectionColor(textColor: string): string {
		return textColor === '#000000' ? '#e5ebf1' : '#3a3d41'
	}

	private generateWhitespaceColor(textColor: string): string {
		return textColor === '#000000' ? '#33333333' : '#e3e4e229'
	}

	private generateRulerColor(backgroundColor: string): string {
		return backgroundColor === '#ffffff' ? '#d3d3d3' : '#5a5a5a'
	}

	/**
	 * リソースのクリーンアップ
	 */
	dispose(): void {
		// カスタムスタイルを削除
		const gridStyle = document.getElementById('monaco-grid-style')
		if (gridStyle) {
			gridStyle.remove()
		}

		// キャッシュクリア
		this.customThemes.clear()
		this.themeCache.clear()
		this.cssCache.clear()
	}
}
