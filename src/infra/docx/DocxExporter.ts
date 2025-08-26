import {
	Document,
	Packer,
	Paragraph,
	TextRun,
	SectionType,
	AlignmentType,
	PageOrientation,
	TextDirection,
	Header,
	Footer,
	PageNumber,
	NumberFormat,
} from 'docx'
import { saveAs } from 'file-saver'
import {
	DocxExporterRepository,
	Manuscript,
	DocxExportSettings,
	DEFAULT_DOCX_SETTINGS,
} from '../../domain'

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
		saveAs(blob, fileName)
	}

	private createVerticalWritingContent(manuscript: Manuscript): Paragraph[] {
		const paragraphs: Paragraph[] = []

		manuscript.pages.forEach(pageLines => {
			pageLines.forEach(line => {
				const children: TextRun[] = [
					new TextRun({
						text: line.text,
						font: this.getPagesCompatibleFont(this.settings.font.family),
						size: this.settings.font.size * 2, // ポイントから半ポイントに変換
					}),
				]

				if (line.ruby) {
					children.push(
						new TextRun({
							text: line.ruby,
							font: this.getPagesCompatibleFont(this.settings.font.family),
							size: Math.max(8, this.settings.font.size * 1.2), // ルビサイズ
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

	private createHorizontalWritingContent(manuscript: Manuscript) {
		// 横書き用のコンテンツ生成（従来の実装）
		return manuscript.pages.map(
			pageLines =>
				new Paragraph({
					children: pageLines.map(line => {
						if (line.ruby) {
							return new TextRun({
								text: `${line.text}(${line.ruby})`,
								font: this.settings.font.family,
								size: this.settings.font.size * 2,
							})
						}
						return new TextRun({
							text: line.text,
							font: this.settings.font.family,
							size: this.settings.font.size * 2,
						})
					}),
					spacing: {
						line: this.settings.lineSpacing * 240,
					},
					alignment: AlignmentType.LEFT,
				})
		)
	}

	private createHeaders() {
		const pageLayout = this.settings.pageLayout || {}
		if (!pageLayout.showHeader) {
			return {}
		}

		// Pages対応のヘッダー設定
		return {
			default: new Header({
				children: [
					new Paragraph({
						children: [
							new TextRun({
								text: this.settings.verticalWriting ? '　' : ' ', // 縦書き用の空白文字
								font: this.settings.font.family,
								size: this.settings.font.size * 2,
							}),
						],
						alignment: this.settings.verticalWriting ? AlignmentType.RIGHT : AlignmentType.LEFT,
					}),
				],
			}),
		}
	}

	private createFooters() {
		const pageLayout = this.settings.pageLayout || {}
		if (!pageLayout.showFooter) {
			return {}
		}

		// Pages対応のフッター設定
		return {
			default: new Footer({
				children: [
					new Paragraph({
						children: [
							new TextRun({
								text: this.settings.verticalWriting ? '　' : ' ', // 縦書き用の空白文字
								font: this.settings.font.family,
								size: this.settings.font.size * 2,
							}),
						],
						alignment: this.settings.verticalWriting ? AlignmentType.RIGHT : AlignmentType.LEFT,
					}),
				],
			}),
		}
	}

	private getPageSize() {
		const sizes: Record<string, { width: number; height: number }> = {
			A4: { width: 11906, height: 16838 }, // A4サイズ（縦書き用の横向き）
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
		// ミリメートルをEMU（English Metric Units）に変換
		// 1mm = 36000 EMU

		// 縦書き用の余白調整
		const margins = this.settings.margins
		const result = {
			top: margins.top,
			right: margins.right,
			bottom: margins.bottom,
			left: margins.left,
			// ヘッダー・フッター余白
			...(margins.header && { header: margins.header }),
			...(margins.footer && { footer: margins.footer }),
			// 装丁余白
			...(margins.gutter && { gutter: margins.gutter }),
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
