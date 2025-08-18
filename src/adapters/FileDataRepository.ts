import { EditorSettings } from '../domain'

export interface FileDataRepository {
	load(): Promise<EditorSettings | null>
	save(settings: EditorSettings): Promise<void>
}
