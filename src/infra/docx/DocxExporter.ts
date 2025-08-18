import { Document, Packer, Paragraph, TextRun, SectionType, AlignmentType } from 'docx'
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
		const doc = new Document({
			sections: [
				{
					properties: {
						type: SectionType.CONTINUOUS,
						page: {
							size: this.getPageSize(),
							margin: this.getMargins(),
						},
					},
					children: manuscript.pages.map(
						pageLines =>
							new Paragraph({
								children: pageLines.map(line => {
									if (line.ruby) {
										return new TextRun({
											text: `${line.text}(${line.ruby})`,
											font: this.settings.font.family,
											size: this.settings.font.size * 2, // ポイント単位
										})
									}
									return new TextRun({
										text: line.text,
										font: this.settings.font.family,
										size: this.settings.font.size * 2, // ポイント単位
									})
								}),
								spacing: {
									line: this.settings.lineSpacing * 240, // 行間（240 = 1行分）
								},
								alignment: this.settings.verticalWriting ? AlignmentType.RIGHT : AlignmentType.LEFT,
							})
					),
				},
			],
		})

		const blob = await Packer.toBlob(doc)
		saveAs(blob, `${manuscript.title}.docx`)
	}

	private getPageSize() {
		const sizes = {
			A4: { width: 11906, height: 16838 },
			A5: { width: 8391, height: 11906 },
			B5: { width: 10006, height: 14173 },
			B6: { width: 7087, height: 10006 },
		}

		const size = sizes[this.settings.pageSize]
		if (this.settings.orientation === 'landscape') {
			return { width: size.height, height: size.width }
		}
		return size
	}

	private getMargins() {
		// ミリメートルをEMU（English Metric Units）に変換
		// 1mm = 36000 EMU
		const mmToEmu = (mm: number) => mm * 36000

		return {
			top: mmToEmu(this.settings.margins.top),
			right: mmToEmu(this.settings.margins.right),
			bottom: mmToEmu(this.settings.margins.bottom),
			left: mmToEmu(this.settings.margins.left),
		}
	}
}
