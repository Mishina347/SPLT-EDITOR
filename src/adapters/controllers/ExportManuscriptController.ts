import { Manuscript } from '../../domain/entities/Manuscript'
import { ExportManuscriptAsDocx } from '../../usecases/docx/ExportManuscriptAsDocx'

export class ExportManuscriptController {
	constructor(private usecase: ExportManuscriptAsDocx) {}

	async handle(manuscript: Manuscript) {
		try {
			await this.usecase.execute(manuscript)
		} catch (e) {
			console.error('Export failed', e)
		}
	}
}
