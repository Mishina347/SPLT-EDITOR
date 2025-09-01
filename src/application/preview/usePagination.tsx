import { LayoutConfig } from '../../domain/preview/pdf/TextContent'
import { PaginationService } from '../../infra/pagenation/PaginationService'
import { TxtWriter } from '../../infra/plainText/TxtWriter'

export class ExportTxtUseCase {
	constructor(private txtWriter: TxtWriter) {}

	async execute(text: string, config: LayoutConfig) {
		const pages = PaginationService.paginate(text, config)
		await this.txtWriter.write(pages)
	}
}
