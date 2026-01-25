import {
	Document,
	Packer,
	Paragraph,
	TextRun,
	SectionType,
	AlignmentType,
	PageOrientation,
	Header,
	Footer,
	PageNumberElement,
} from 'docx'
import { saveAs } from 'file-saver'
import {
	DocxExporterRepository,
	Manuscript,
	DocxExportSettings,
	DEFAULT_DOCX_SETTINGS,
} from '../../domain'
import { isTauri } from '../../utils'

export class DocxExporter implements DocxExporterRepository {
	constructor(private settings: DocxExportSettings = DEFAULT_DOCX_SETTINGS) {}

	async export(manuscript: Manuscript, fileExtension: 'docx' | 'dotx' = 'docx'): Promise<void> {
		console.log('[DEBUG] DocxExporter received settings:', this.settings)
		console.log('[DEBUG] Vertical writing:', this.settings.verticalWriting)
		console.log('[DEBUG] Page layout:', this.settings.pageLayout)
		console.log('[DEBUG] Margins:', this.settings.margins)
		console.log('[DEBUG] Font:', this.settings.font)

		// 設定値を確実に適用
		const pageProperties = {
			type: SectionType.CONTINUOUS,
			page: {
				size: this.getPageSize(),
				margin: this.getMargins(),
			},
			// 縦書き用のページ設定を直接指定
			...this.getVerticalWritingPageProperties(),
			// 横書きの場合は明示的に縦向きを設定
			...(this.settings.verticalWriting
				? {}
				: {
						pageOrientation:
							this.settings.orientation === 'landscape'
								? PageOrientation.LANDSCAPE
								: PageOrientation.PORTRAIT,
					}),
		}

		console.log('[DEBUG] Page properties:', pageProperties)

		const doc = new Document({
			sections: [
				{
					properties: pageProperties,
					headers: this.createHeaders(),
					footers: this.createFooters(),
					children: this.settings.verticalWriting
						? this.createVerticalWritingContent(manuscript)
						: this.createHorizontalWritingContent(manuscript),
				},
			],
		})

		const blob = await Packer.toBlob(doc)
		const fileName = `${manuscript.title}.${fileExtension}`
		
		if (isTauri()) {
			// Tauri環境ではTauriコマンドを使用してファイルを保存
			try {
				const { invoke } = await import('@tauri-apps/api/core')
				// BlobをUint8Arrayに変換
				const arrayBuffer = await blob.arrayBuffer()
				const uint8Array = new Uint8Array(arrayBuffer)
				
				await invoke<string>('saveBinaryFile', {
					fileName,
					data: Array.from(uint8Array),
				})
			} catch (error) {
				console.error('DOCX export failed in Tauri:', error)
				throw new Error(`DOCXファイルの保存に失敗しました: ${error}`)
			}
		} else {
			// ブラウザ環境ではfile-saverを使用
			saveAs(blob, fileName)
		}
	}

	private createVerticalWritingContent(manuscript: Manuscript): Paragraph[] {
		const paragraphs: Paragraph[] = []

		manuscript.pages.forEach(pageLines => {
			pageLines.forEach(line => {
				const children: TextRun[] = []

				if (line.ruby) {
					// ルビが指定されている場合、メインテキストとルビを別々のTextRunとして追加
					// メインテキスト
					children.push(
						new TextRun({
							text: line.text,
							font: this.getPagesCompatibleFont(this.settings.font.family),
							size: this.settings.font.size * 2, // ポイントから半ポイントに変換
							color: '000000', // テキスト色を黒に設定（エディタのテーマを反映しない）
						})
					)
					// ルビ（小さなフォントサイズで括弧付き）
					children.push(
						new TextRun({
							text: `(${line.ruby})`,
							font: this.getPagesCompatibleFont(this.settings.font.family),
							size: Math.max(8, this.settings.font.size * 1.2) * 2, // ルビサイズ（半ポイント単位）
							color: '000000', // テキスト色を黒に設定（エディタのテーマを反映しない）
						})
					)
				} else {
					children.push(
						new TextRun({
							text: line.text,
							font: this.getPagesCompatibleFont(this.settings.font.family),
							size: this.settings.font.size * 2, // ポイントから半ポイントに変換
							color: '000000', // テキスト色を黒に設定（エディタのテーマを反映しない）
						})
					)
				}

				const paragraph = new Paragraph({
					children,
					...this.getVerticalWritingParagraphProperties(),
				})

				paragraphs.push(paragraph)
			})
		})

		return paragraphs
	}

	private createHorizontalWritingContent(manuscript: Manuscript): Paragraph[] {
		// 横書き用のコンテンツ生成
		// 各行を別々のParagraphにして改行を反映
		const paragraphs: Paragraph[] = []

		manuscript.pages.forEach(pageLines => {
			pageLines.forEach(line => {
				const children: TextRun[] = []

				if (line.ruby) {
					children.push(
						new TextRun({
							text: `${line.text}(${line.ruby})`,
							font: this.settings.font.family,
							size: this.settings.font.size * 2,
							color: '000000', // テキスト色を黒に設定（エディタのテーマを反映しない）
						})
					)
				} else {
					children.push(
						new TextRun({
							text: line.text || ' ', // 空行の場合はスペース
							font: this.settings.font.family,
							size: this.settings.font.size * 2,
							color: '000000', // テキスト色を黒に設定（エディタのテーマを反映しない）
						})
					)
				}

				const paragraph = new Paragraph({
					children,
					spacing: {
						line: this.settings.lineSpacing * 240,
					},
					alignment: AlignmentType.LEFT,
				})

				paragraphs.push(paragraph)
			})
		})

		return paragraphs
	}

	private createHeaders() {
		const pageLayout = this.settings.pageLayout || {}
		const showHeader = pageLayout.showHeader === true
		const pageNumberPosition = pageLayout.pageNumberPosition || 'bottom'

		if (!showHeader && pageNumberPosition !== 'top') {
			return {}
		}

		const headerChildren: Paragraph[] = []

		// ページ番号を追加
		if (pageNumberPosition === 'top') {
			headerChildren.push(
				new Paragraph({
					children: [
						new TextRun({
							children: [new PageNumberElement()],
							color: '000000', // テキスト色を黒に設定（エディタのテーマを反映しない）
						}),
					],
					alignment: AlignmentType.CENTER,
				})
			)
		} else if (showHeader) {
			// ヘッダー表示だがページ番号なしの場合
			headerChildren.push(
				new Paragraph({
					children: [
						new TextRun({
							text: this.settings.verticalWriting ? '　' : ' ',
							font: this.settings.font.family,
							size: this.settings.font.size * 2,
							color: '000000', // テキスト色を黒に設定（エディタのテーマを反映しない）
						}),
					],
					alignment: this.settings.verticalWriting ? AlignmentType.RIGHT : AlignmentType.LEFT,
				})
			)
		}

		if (headerChildren.length === 0) {
			return {}
		}

		return {
			default: new Header({
				children: headerChildren,
			}),
		}
	}

	private createFooters() {
		const pageLayout = this.settings.pageLayout || {}
		const showFooter = pageLayout.showFooter !== false // デフォルトで表示
		const pageNumberPosition = pageLayout.pageNumberPosition || 'bottom'

		// ページ番号がnoneでない場合は、フッターを表示
		if (pageNumberPosition === 'none' && !showFooter) {
			return {}
		}

		const footerChildren: Paragraph[] = []

		// ページ番号を追加
		if (pageNumberPosition === 'bottom') {
			footerChildren.push(
				new Paragraph({
					children: [
						new TextRun({
							children: [new PageNumberElement()],
							color: '000000', // テキスト色を黒に設定（エディタのテーマを反映しない）
						}),
					],
					alignment: AlignmentType.CENTER,
				})
			)
		} else if (showFooter) {
			// フッター表示だがページ番号なしの場合
			footerChildren.push(
				new Paragraph({
					children: [
						new TextRun({
							text: this.settings.verticalWriting ? '　' : ' ',
							font: this.settings.font.family,
							size: this.settings.font.size * 2,
							color: '000000', // テキスト色を黒に設定（エディタのテーマを反映しない）
						}),
					],
					alignment: this.settings.verticalWriting ? AlignmentType.RIGHT : AlignmentType.LEFT,
				})
			)
		}

		if (footerChildren.length === 0) {
			return {}
		}

		return {
			default: new Footer({
				children: footerChildren,
			}),
		}
	}

	private getPageSize() {
		const sizes: Record<string, { width: number; height: number }> = {
			A4: { width: 11906, height: 16838 }, // A4サイズ（縦向き: 210mm x 297mm）
			A5: { width: 8391, height: 11906 },
			B5: { width: 10006, height: 14173 },
			B6: { width: 7087, height: 10006 },
		}

		const size = sizes[this.settings.pageSize] || sizes.A4
		// 縦書きの場合は常に横向きにする
		const isLandscape = this.settings.verticalWriting || this.settings.orientation === 'landscape'
		const result = isLandscape ? { width: size.height, height: size.width } : size

		console.log(
			`[DEBUG] Page size: ${this.settings.pageSize}, landscape: ${isLandscape}, result:`,
			result
		)

		return result
	}

	private getMargins() {
		// docxライブラリはUniversalMeasure型を受け取るため、文字列形式（"30mm"）で指定
		// これにより、ライブラリが自動的に適切な単位に変換する
		const margins = this.settings.margins
		const result: any = {
			top: `${margins.top}mm`,
			right: `${margins.right}mm`,
			bottom: `${margins.bottom}mm`,
			left: `${margins.left}mm`,
		}

		// ヘッダー・フッター余白
		if (margins.header) {
			result.header = `${margins.header}mm`
		}
		if (margins.footer) {
			result.footer = `${margins.footer}mm`
		}
		// 装丁余白
		if (margins.gutter) {
			result.gutter = `${margins.gutter}mm`
		}

		console.log('[DEBUG] Margins calculation:', margins, '->', result)

		return result
	}

	private getVerticalWritingPageProperties() {
		if (!this.settings.verticalWriting) {
			console.log('[DEBUG] Vertical writing disabled')
			return {}
		}

		const pageLayout = this.settings.pageLayout || {}
		const properties: any = {
			// Pages対応の縦書き設定
			pageOrientation: PageOrientation.LANDSCAPE,
			// 縦書き用のテキスト方向を明示的に指定
			textDirection: 'tbRl', // 上から下、右から左
		}

		// 段組み設定
		if (pageLayout.columns && pageLayout.columns > 1) {
			properties.columns = {
				count: Math.max(1, Math.min(10, pageLayout.columns)), // 1-10段に制限
				space: pageLayout.columnGap ? Math.max(0, pageLayout.columnGap * 36000) : 360000, // 10mmをデフォルト
			}
		}

		console.log('[DEBUG] Vertical writing page properties:', properties)
		return properties
	}

	private getVerticalWritingParagraphProperties() {
		if (!this.settings.verticalWriting) {
			return {
				alignment: AlignmentType.LEFT,
				spacing: {
					line: Math.max(120, Math.min(480, this.settings.lineSpacing * 240)), // 0.5-2.0行に制限
				},
			}
		}

		return {
			// Pages対応の縦書き段落設定
			alignment: AlignmentType.RIGHT, // 縦書きでは右揃え
			// 縦書き用の間隔設定
			spacing: {
				line: Math.max(120, Math.min(480, this.settings.lineSpacing * 240)), // 0.5-2.0行に制限
				before: 120, // 段落前の間隔
				after: 120, // 段落後の間隔
			},
			// Pages対応の縦書き設定
			textDirection: 'tbRl', // 上から下、右から左
		}
	}

	private getPagesCompatibleFont(fontFamily: string): string {
		// Pagesで確実に認識されるフォント名に変換
		const fontMap: Record<string, string> = {
			游明朝: 'Yu Mincho',
			游ゴシック: 'Yu Gothic',
			ヒラギノ明朝: 'Hiragino Mincho ProN',
			ヒラギノ角ゴ: 'Hiragino Kaku Gothic ProN',
			MS明朝: 'MS Mincho',
			MSゴシック: 'MS Gothic',
			明朝体: 'Mincho',
			ゴシック体: 'Gothic',
		}

		return fontMap[fontFamily] || fontFamily
	}
}
