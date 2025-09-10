// src/usecases/SaveEditorSettings.ts
import { FileDataRepository } from '@/adapters'
import { Settings } from '@/domain'

export async function saveEditorSettings(
	repo: FileDataRepository,
	settings: Settings
): Promise<void> {
	await repo.save(settings)
}
