// src/usecases/SaveEditorSettings.ts
import { FileDataRepository } from '../adapters'
import { EditorSettings } from '../domain'

export async function saveEditorSettings(
	repo: FileDataRepository,
	settings: EditorSettings
): Promise<void> {
	await repo.save(settings)
}
