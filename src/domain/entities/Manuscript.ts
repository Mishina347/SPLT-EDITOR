export type ManuscriptLine = {
	text: string
	ruby?: string // ふりがな
}

export interface Manuscript {
	title: string
	pages: ManuscriptLine[][]
}

export interface DocxExporterRepository {
	export(manuscript: Manuscript): Promise<void>
}
