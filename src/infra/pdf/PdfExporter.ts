import jsPDF from 'jspdf'
import { Manuscript, PdfExportSettings } from '@/domain'
import { ManuscriptLine } from '@/domain/entities/Manuscript'

export class PdfExporter {
	private settings: PdfExportSettings
	private doc!: jsPDF
	private pageWidth!: number
	private pageHeight!: number
	private contentWidth!: number
	private contentHeight!: number
	private currentY!: number
	private isVerticalWriting: boolean = false

	constructor(settings: PdfExportSettings) {
		this.settings = settings
		this.initializeDocument()
	}

	private initializeDocument() {
		const pageSize = this.getPageSize()

		// PDFドキュメントの初期化
		this.doc = new jsPDF({
			orientation: this.settings.orientation,
			unit: 'mm',
			format: this.settings.pageSize,
			compress: true,
		})

		// 日本語フォントを追加
		this.addJapaneseFonts()

		this.pageWidth = pageSize.width
		this.pageHeight = pageSize.height
		this.contentWidth = pageSize.width - this.settings.margins.left - this.settings.margins.right
		this.contentHeight = pageSize.height - this.settings.margins.top - this.settings.margins.bottom
		this.currentY = this.settings.margins.top
	}

	private async addJapaneseFonts() {
		console.log('=== 日本語フォント読み込み開始 ===')

		// タイムアウト設定（30秒）
		const timeout = 30000

		try {
			// 方法1: 事前にBase64化されたフォントデータを使用（推奨）
			const base64FontPath = '/fonts/NotoSerifJP-Regular.base64.txt'
			try {
				console.log('事前Base64方式でフォント読み込みを試行中...')

				// タイムアウト付きのfetch
				const controller = new AbortController()
				const timeoutId = setTimeout(() => controller.abort(), timeout)

				const base64Response = await fetch(base64FontPath, {
					signal: controller.signal,
				})

				clearTimeout(timeoutId)

				if (base64Response.ok) {
					const fontBase64 = await base64Response.text()
					console.log(`Base64変換完了: ${fontBase64.length}文字`)
					this.doc.addFileToVFS('NotoSerifJP-Regular.ttf', fontBase64)
					this.doc.addFont('NotoSerifJP-Regular.ttf', 'NotoSerifJP', 'normal')
					this.doc.addFont('NotoSerifJP-Regular.ttf', 'NotoSerifJP', 'bold')

					// フォントを設定してテスト
					try {
						this.doc.setFont('NotoSerifJP', 'normal')
						this.doc.setFont('NotoSerifJP', 'bold')
						console.log('埋め込みフォントの追加に成功しました（事前Base64方式）')
						return
					} catch (error) {
						console.warn('❌ フォント設定に失敗、動的変換を試行:', error)
					}
				} else {
					console.warn(`Base64フォントファイルの取得に失敗: ${base64Response.status}`)
				}
			} catch (error) {
				if (error instanceof Error && error.name === 'AbortError') {
					console.warn('事前Base64方式でタイムアウトが発生しました')
				} else {
					console.log('事前Base64方式でのフォント追加に失敗、動的変換を試行:', error)
				}
			}

			// 方法2: 動的にOTFファイルをBase64エンコード
			const fontPath = '/fonts/NotoSerifJP-Regular.otf'
			try {
				console.log('動的Base64方式でフォント読み込みを試行中...')

				// タイムアウト付きのfetch
				const controller = new AbortController()
				const timeoutId = setTimeout(() => controller.abort(), timeout)

				const fontResponse = await fetch(fontPath, {
					signal: controller.signal,
				})

				clearTimeout(timeoutId)

				if (!fontResponse.ok) {
					throw new Error(`Font fetch failed: ${fontResponse.status}`)
				}

				const fontArrayBuffer = await fontResponse.arrayBuffer()
				console.log(`OTFフォントデータ取得成功: ${fontArrayBuffer.byteLength}バイト`)

				const fontBase64 = this.arrayBufferToBase64(fontArrayBuffer)
				console.log(`Base64変換完了: ${fontBase64.length}文字`)

				// jsPDFにBase64エンコードされたフォントを追加
				this.doc.addFileToVFS('NotoSerifJP-Regular.ttf', fontBase64)
				this.doc.addFont(fontBase64, 'NotoSerifJP', 'normal')
				this.doc.addFont(fontBase64, 'NotoSerifJP', 'bold')

				// フォントを設定してテスト
				try {
					this.doc.setFont('NotoSerifJP', 'normal')
					console.log('✅ 埋め込みフォントの追加に成功しました（動的Base64方式）')
					return
				} catch (error) {
					console.warn('❌ フォント設定に失敗、システムフォントを使用:', error)
				}
			} catch (error) {
				if (error instanceof Error && error.name === 'AbortError') {
					console.warn('動的Base64方式でタイムアウトが発生しました')
				} else {
					console.warn('動的Base64方式でのフォント追加に失敗:', error)
				}
			}

			// フォールバック: システムフォントを使用
			console.log('埋め込みフォントの追加に失敗、システムフォントを使用します')
			this.useSystemFonts()
		} catch (error) {
			console.warn('日本語フォントの追加に完全に失敗しました:', error)
			this.useSystemFonts()
		}

		console.log('=== 日本語フォント読み込み完了 ===')
	}

	private async addJapaneseFontsWithRetry(maxRetries: number = 3): Promise<void> {
		for (let attempt = 1; attempt <= maxRetries; attempt++) {
			try {
				console.log(`フォント読み込み試行 ${attempt}/${maxRetries}`)
				await this.addJapaneseFonts()
				return // 成功したら終了
			} catch (error) {
				console.warn(`フォント読み込み試行 ${attempt} が失敗:`, error)

				if (attempt === maxRetries) {
					console.error('最大試行回数に達しました。システムフォントを使用します。')
					this.useSystemFonts()
					return
				}

				// 次の試行前に少し待機
				await new Promise(resolve => setTimeout(resolve, 1000 * attempt))
			}
		}
	}

	private arrayBufferToBase64(buffer: ArrayBuffer): string {
		try {
			// 効率的なBase64変換（チャンク処理）
			const bytes = new Uint8Array(buffer)
			const len = bytes.byteLength
			const chunkSize = 8192 // 8KBチャンクで処理
			let result = ''

			for (let i = 0; i < len; i += chunkSize) {
				const chunk = bytes.slice(i, Math.min(i + chunkSize, len))
				let binary = ''
				for (let j = 0; j < chunk.length; j++) {
					binary += String.fromCharCode(chunk[j])
				}
				result += btoa(binary)
			}

			return result
		} catch (error) {
			console.warn('Base64変換に失敗', error)
			return this.arrayBufferToBase64Fallback(buffer)
		}
	}

	private arrayBufferToBase64Fallback(buffer: ArrayBuffer): string {
		// 標準的なBase64変換
		const bytes = new Uint8Array(buffer)
		let binary = ''
		for (let i = 0; i < bytes.byteLength; i++) {
			binary += String.fromCharCode(bytes[i])
		}
		return btoa(binary)
	}

	private useSystemFonts() {
		// システムフォントの優先順位（日本語対応）
		const systemFonts = [
			'Hiragino Mincho ProN',
			'Hiragino Kaku Gothic ProN',
			'Yu Mincho',
			'Yu Gothic',
			'MS Mincho',
			'MS Gothic',
			'Noto Serif CJK JP',
			'Noto Sans CJK JP',
			'Arial Unicode MS',
			'Helvetica',
		]

		// 利用可能なフォントを確認
		let fontFound = false
		for (const font of systemFonts) {
			try {
				this.doc.setFont(font)
				console.log(`システムフォントを使用: ${font}`)
				fontFound = true
				break
			} catch (error) {
				continue
			}
		}

		if (!fontFound) {
			// デフォルトフォントを使用
			console.log('デフォルトフォントを使用します')
			try {
				this.doc.setFont('Helvetica')
			} catch (error) {
				console.warn('デフォルトフォントの設定にも失敗:', error)
			}
		}
	}

	private getPageSize(): { width: number; height: number } {
		const sizes = {
			A4: { width: 210, height: 297 },
			A5: { width: 148, height: 210 },
			B5: { width: 176, height: 250 },
			B6: { width: 125, height: 176 },
		}

		const size = sizes[this.settings.pageSize] || sizes.A4
		return this.settings.orientation === 'landscape'
			? { width: size.height, height: size.width }
			: size
	}

	private setupVerticalWriting() {
		this.isVerticalWriting = true
		// 縦書き用の設定
		this.doc.setFontSize(this.settings.font.size)

		// 縦書き用のテキスト方向を設定
		this.doc.setTextColor(0, 0, 0)

		// 埋め込みフォントを設定
		try {
			this.doc.setFont('NotoSerifJP', 'normal')
		} catch (error) {
			console.warn('埋め込みフォントの設定に失敗、デフォルトフォントを使用:', error)
		}
	}

	private addHeader(title: string) {
		this.doc.setTextColor(0, 0, 0)
		this.doc.setFontSize(16)

		// 埋め込みフォントを使用
		try {
			this.doc.setFont('NotoSerifJP', 'bold')
		} catch (error) {
			console.warn('埋め込みフォントの設定に失敗、デフォルトフォントを使用:', error)
		}

		const headerText = title || '無題の文書'

		if (this.isVerticalWriting) {
			// 縦書き用のヘッダー（右から左へ、上から下へ）
			this.doc.text(
				headerText,
				this.pageWidth - this.settings.margins.right,
				this.settings.margins.top - 10,
				{ angle: -90, align: 'center' }
			)
		} else {
			// 横書き用のヘッダー
			this.doc.text(headerText, this.settings.margins.left, this.settings.margins.top - 10)
		}

		this.currentY += 20
	}

	private addOutline(manuscript: Manuscript) {
		if (!this.settings.outline.enabled) return

		// 埋め込みフォントを使用
		try {
			this.doc.setFont('NotoSerifJP', 'bold')
		} catch (error) {
			console.warn('埋め込みフォントの設定に失敗、デフォルトフォントを使用:', error)
		}

		this.doc.setFontSize(14)

		// ファイルタイトル名を横書きで表示
		const outlineTitle = manuscript.title || '無題の文書'
		this.doc.text(outlineTitle, this.settings.margins.left, this.currentY)
		this.currentY += 20

		// ページごとの見出しを追加
		manuscript.pages.forEach((pageLines, pageIndex) => {
			if (this.currentY > this.pageHeight - this.settings.margins.bottom) {
				this.doc.addPage()
				this.currentY = this.settings.margins.top
			}

			const pageTitle = `ページ ${pageIndex + 1}`

			if (this.isVerticalWriting) {
				// 縦書き用のページタイトル（右から左へ、上から下へ）
				this.doc.text(pageTitle, this.pageWidth - this.settings.margins.right - 10, this.currentY, {
					angle: -90,
					align: 'right',
				})
			} else {
				// 横書き用のページタイトル
				this.doc.text(pageTitle, this.settings.margins.left + 10, this.currentY)
			}

			this.currentY += 15
		})

		this.currentY += 20
	}

	private addContent(manuscript: Manuscript) {
		try {
			this.doc.setFont('NotoSerifJP', 'normal')
		} catch {
			console.warn('フォント設定失敗 → デフォルト使用')
		}
		this.doc.setFontSize(this.settings.font.size)

		manuscript.pages.forEach(pageLines => {
			if (this.isVerticalWriting) {
				// 縦書きの場合、1行に20文字詰め込む
				const charsPerLine = 20 // 1行あたり20文字

				// 文字間隔と行間隔を計算（余白を考慮）
				const charSpacing = this.settings.font.size * this.settings.lineSpacing // 文字間隔
				const lineSpacing = this.settings.font.size * 1.2 // 行間隔（余白を含む）

				// 開始位置（右上から）
				let startX = this.pageWidth - this.settings.margins.right
				let startY = this.settings.margins.top

				// 各行を処理
				pageLines.forEach((line: ManuscriptLine) => {
					if (line.text.trim()) {
						// 行の文字数が20文字を超える場合は分割
						const textChunks = this.splitTextIntoChunks(line.text, charsPerLine)

						textChunks.forEach(chunk => {
							// 現在の行がページのコンテンツ表示箇所を超えているかチェック
							const requiredHeight = chunk.length * charSpacing

							if (startY + requiredHeight > this.pageHeight - this.settings.margins.bottom) {
								// ページを超える場合は改ページ
								this.doc.addPage()
								startY = this.settings.margins.top
							}

							// 各チャンクを描画
							this.drawVerticalTextChunk(chunk, startX, startY, charSpacing)

							// ルビ
							if (line.ruby) {
								this.doc.setFontSize(this.settings.font.size * 0.8)
								this.drawVerticalTextChunk(line.ruby, startX - 5, startY, charSpacing * 0.8)
								this.doc.setFontSize(this.settings.font.size)
							}

							// 次の行の位置を設定（指定した余白を取る）
							startY += requiredHeight + this.settings.font.size * 0.5 // 行間の余白を追加
						})
					}
				})
			} else {
				pageLines.forEach((line: ManuscriptLine) => {
					if (line.text.trim()) {
						// 横書きの場合も行の高さをチェック
						const lineHeight = this.settings.font.size * this.settings.lineSpacing

						if (this.currentY + lineHeight > this.pageHeight - this.settings.margins.bottom) {
							// ページの末尾を超える場合は改ページ
							this.doc.addPage()
							this.currentY = this.settings.margins.top
						}

						this.doc.text(line.text, this.settings.margins.left, this.currentY)
						this.currentY += lineHeight
					}
				})
			}
		})
	}

	private addFooter() {
		const footerY = this.pageHeight - this.settings.margins.bottom + 10

		// 埋め込みフォントを使用
		try {
			this.doc.setFont('NotoSerifJP', 'normal')
		} catch (error) {
			console.warn('埋め込みフォントの設定に失敗、デフォルトフォントを使用:', error)
		}

		this.doc.setFontSize(10)

		// ページ番号を横書きで表示
		const pageNumberText = `${this.doc.getCurrentPageInfo().pageNumber}`
		this.doc.text(pageNumberText, this.pageWidth - this.settings.margins.right, footerY, {
			align: 'right',
		})
	}

	// テキストを指定された文字数で分割する
	private splitTextIntoChunks(text: string, charsPerChunk: number): string[] {
		const chunks: string[] = []
		for (let i = 0; i < text.length; i += charsPerChunk) {
			chunks.push(text.slice(i, i + charsPerChunk))
		}
		return chunks
	}

	// 縦書きテキストチャンクを描画する
	private drawVerticalTextChunk(text: string, startX: number, startY: number, charSpacing: number) {
		let y = startY

		// 縦書きで文字を描画（上から下へ）
		for (const char of text) {
			// 縦書き用の角度設定（-90度で縦書き）
			this.doc.text(char, startX, y, { angle: -90 })
			y += charSpacing
		}
	}

	private drawVerticalText(
		text: string,
		startX: number,
		startY: number,
		lineHeight: number = this.settings.font.size * this.settings.lineSpacing
	) {
		let x = startX
		let y = startY

		// 縦書きの場合、文字を縦に並べる
		// 行全体がページに収まるかチェック
		const textHeight = text.length * lineHeight
		if (y + textHeight > this.pageHeight - this.settings.margins.bottom) {
			// 行全体がページに収まらない場合は改ページ
			this.doc.addPage()
			y = this.settings.margins.top
		}

		// 縦書きで文字を描画（上から下へ）
		// 文字間隔を適切に調整
		const charSpacing = this.settings.font.size * 0.8 // 文字間隔をフォントサイズの80%に設定
		for (const char of text) {
			this.doc.text(char, x, y, { angle: 0 })
			y += lineHeight
		}
	}

	private addPageNumbers() {
		// 各ページにページ番号を追加
		const totalPages = this.doc.getNumberOfPages()

		for (let pageNum = 1; pageNum <= totalPages; pageNum++) {
			this.doc.setPage(pageNum)

			const footerY = this.pageHeight - this.settings.margins.bottom + 10

			// 埋め込みフォントを使用
			try {
				this.doc.setFont('NotoSerifJP', 'normal')
			} catch (error) {
				console.warn('埋め込みフォントの設定に失敗、デフォルトフォントを使用:', error)
			}

			this.doc.setFontSize(10)

			// ページ番号を横書きで表示
			const pageNumberText = `${pageNum} / ${totalPages}`
			this.doc.text(pageNumberText, this.pageWidth - this.settings.margins.right, footerY, {
				align: 'right',
			})
		}
	}

	async export(manuscript: Manuscript): Promise<void> {
		try {
			console.log('=== PDF出力開始 ===')

			// 1. まずフォントを確実に読み込む（重要！）
			console.log('フォント読み込みを開始します...')
			await this.addJapaneseFontsWithRetry()
			console.log('フォント読み込みが完了しました')

			// 3. 縦書き用の設定
			if (this.settings.verticalWriting) {
				console.log('縦書き設定を適用します...')
				this.setupVerticalWriting()
			}

			// 4. ヘッダーの追加
			console.log('ヘッダーを追加します...')
			this.addHeader(manuscript.title)

			// 5. アウトラインの追加
			if (this.settings.outline.enabled) {
				console.log('アウトラインを追加します...')
				this.addOutline(manuscript)
			}

			// 6. 本文の追加
			console.log('本文を追加します...')
			this.addContent(manuscript)

			// 7. フッターの追加
			console.log('フッターを追加します...')
			this.addFooter()

			// 8. ページ番号の追加
			console.log('ページ番号を追加します...')
			this.addPageNumbers()

			// 9. フォントが正しく設定されているか最終確認
			console.log('フォント設定の最終確認を実行します...')
			await this.verifyFontSetup()

			// 10. PDFの保存
			console.log('PDF保存を開始します...')
			this.doc.save(`${manuscript.title || 'document'}.pdf`)

			console.log('✅ PDF出力が完了しました')
		} catch (error) {
			console.error('❌ PDF出力中にエラーが発生しました:', error)

			// エラーの詳細をログ出力
			if (error instanceof Error) {
				console.error('エラーメッセージ:', error.message)
				console.error('エラースタック:', error.stack)
			}

			throw new Error(
				`PDF出力に失敗しました: ${error instanceof Error ? error.message : String(error)}`
			)
		}
	}

	private async verifyFontSetup(): Promise<void> {
		console.log('=== フォント設定の最終確認 ===')

		try {
			// 現在のフォントを確認
			const currentFont = this.doc.getFont()
			console.log(`最終確認 - フォント: ${currentFont.fontName}, スタイル: ${currentFont.fontStyle}`)

			// 日本語テキストでテスト描画
			const testText = '日本語テスト：あいうえお、漢字、ひらがな、カタカナ'
			this.doc.setFontSize(12)

			// テスト描画を実行（エラーが発生したら例外を投げる）
			this.doc.text(testText, 10, 10)
			console.log('✅ フォント設定の最終確認が完了しました')
		} catch (error) {
			console.error('❌ フォント設定の最終確認に失敗:', error)
			throw new Error(
				`フォント設定の確認に失敗しました: ${error instanceof Error ? error.message : String(error)}`
			)
		}
	}
}
