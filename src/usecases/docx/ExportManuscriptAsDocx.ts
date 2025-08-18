import { DocxExporterRepository, Manuscript } from '../../domain/entities/Manuscript'

export class ExportManuscriptAsDocx {
	constructor(private exporter: DocxExporterRepository) {}

	async execute(manuscript: Manuscript): Promise<void> {
		if (!manuscript.pages || manuscript.pages.length === 0) {
			throw new Error('原稿が空です')
		}
		await this.exporter.export(manuscript)
	}
}
