import {
	Document,
	Packer,
	Paragraph,
	TextRun,
	SectionType,
	AlignmentType,
	PageOrientation,
	TextDirection,
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

	async export(manuscript: Manuscript): Promise<void> {
		// デバッグ用：設定値をログ出力
		if (process.env.NODE_ENV === 'development') {
			console.log('[DocxExporter] Export settings:', this.settings)
			console.log('[DocxExporter] Vertical writing enabled:', this.settings.verticalWriting)
			console.log('[DocxExporter] Page size:', this.getPageSize())
			console.log('[DocxExporter] Margins:', this.getMargins())
			console.log(
				'[DocxExporter] Vertical writing properties:',
				this.getVerticalWritingPageProperties()
			)
			console.log(
				'[DocxExporter] Vertical writing paragraph properties:',
				this.getVerticalWritingParagraphProperties()
			)
		}

		const doc = new Document({
			sections: [
				{
					properties: {
						type: SectionType.CONTINUOUS,
						page: {
							size: this.getPageSize(),
							margin: this.getMargins(),
						},
						// 縦書き用のページ設定を直接指定
						...this.getVerticalWritingPageProperties(),
					},
					children: this.settings.verticalWriting
						? this.createVerticalWritingContent(manuscript)
						: this.createHorizontalWritingContent(manuscript),
				},
			],
		})

		// デバッグ用：生成されたドキュメントの構造をログ出力
		if (process.env.NODE_ENV === 'development') {
			console.log('[DocxExporter] Generated document structure:', doc)
		}

		const blob = await Packer.toBlob(doc)
		saveAs(blob, `${manuscript.title}.docx`)
	}

	private createVerticalWritingContent(manuscript: Manuscript) {
		// 縦書き用のコンテンツ生成
		const paragraphs: Paragraph[] = []

		manuscript.pages.forEach((pageLines, pageIndex) => {
			// 各ページの行を縦書き用に処理
			pageLines.forEach((line, lineIndex) => {
				if (line.ruby) {
					paragraphs.push(
						new Paragraph({
							children: [
								new TextRun({
									text: `${line.text}(${line.ruby})`,
									font: this.settings.font.family,
									size: this.settings.font.size * 2,
								}),
							],
							// 縦書き用の段落設定
							...this.getVerticalWritingParagraphProperties(),
						})
					)
				} else {
					paragraphs.push(
						new Paragraph({
							children: [
								new TextRun({
									text: line.text,
									font: this.settings.font.family,
									size: this.settings.font.size * 2,
								}),
							],
							// 縦書き用の段落設定
							...this.getVerticalWritingParagraphProperties(),
						})
					)
				}
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

	private getPageSize() {
		const sizes = {
			A4: { width: 11906, height: 16838 }, // A4サイズ（縦書き用の横向き）
			A5: { width: 8391, height: 11906 },
			B5: { width: 10006, height: 14173 },
			B6: { width: 7087, height: 10006 },
		}

		const size = sizes[this.settings.pageSize]
		// 縦書きの場合は常に横向きにする
		if (this.settings.verticalWriting || this.settings.orientation === 'landscape') {
			return { width: size.height, height: size.width }
		}
		return size
	}

	private getMargins() {
		// ミリメートルをEMU（English Metric Units）に変換
		// 1mm = 36000 EMU
		const mmToEmu = (mm: number) => mm * 36000

		// 縦書き用の余白調整
		const margins = this.settings.margins
		if (this.settings.verticalWriting) {
			// 縦書きの場合、左右の余白を調整
			return {
				top: mmToEmu(margins.top),
				right: mmToEmu(margins.right),
				bottom: mmToEmu(margins.bottom),
				left: mmToEmu(margins.left),
				// ヘッダー・フッター余白
				...(margins.header && { header: mmToEmu(margins.header) }),
				...(margins.footer && { footer: mmToEmu(margins.footer) }),
				// 装丁余白
				...(margins.gutter && { gutter: mmToEmu(margins.gutter) }),
			}
		}

		return {
			top: mmToEmu(margins.top),
			right: mmToEmu(margins.right),
			bottom: mmToEmu(margins.bottom),
			left: mmToEmu(margins.left),
			// ヘッダー・フッター余白
			...(margins.header && { header: mmToEmu(margins.header) }),
			...(margins.footer && { footer: mmToEmu(margins.footer) }),
			// 装丁余白
			...(margins.gutter && { gutter: mmToEmu(margins.gutter) }),
		}
	}

	private getVerticalWritingPageProperties() {
		if (!this.settings.verticalWriting) {
			return {}
		}

		const pageLayout = this.settings.pageLayout || {}
		const properties: any = {
			// 縦書き用のページ設定
			pageOrientation: PageOrientation.LANDSCAPE,
			// 縦書き用のテキスト方向設定
			textDirection: TextDirection.TOP_TO_BOTTOM_RIGHT_TO_LEFT,
		}

		// 段組み設定
		if (pageLayout.columns && pageLayout.columns > 1) {
			properties.columns = {
				count: pageLayout.columns,
				space: pageLayout.columnGap ? pageLayout.columnGap * 36000 : 360000, // 10mmをデフォルト
			}
		}

		return properties
	}

	private getVerticalWritingParagraphProperties() {
		if (!this.settings.verticalWriting) {
			return {
				alignment: AlignmentType.LEFT,
				spacing: {
					line: this.settings.lineSpacing * 240,
				},
			}
		}

		return {
			// 縦書き用の段落設定
			alignment: AlignmentType.RIGHT, // 縦書きでは右揃え
			// 縦書き用の間隔設定
			spacing: {
				line: this.settings.lineSpacing * 240,
				before: 120, // 段落前の間隔
				after: 120, // 段落後の間隔
			},
		}
	}
}
