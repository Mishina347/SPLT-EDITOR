import { FileDataRepository } from '../adapters'
import { EditorSettings } from '../domain'
import { defaultEditorSettings } from '../domain/editor/EditorState'

export async function loadEditorSettings(repo: FileDataRepository): Promise<EditorSettings> {
	const saved = await repo.load()
	return saved ?? defaultEditorSettings()
}
