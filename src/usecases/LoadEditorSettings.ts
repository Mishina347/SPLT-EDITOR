import { FileDataRepository } from '../adapters'
import { Settings } from '../domain'
import { getDefaultSettingForDevice } from '../domain/entities/defaultSetting'

export async function loadEditorSettings(repo: FileDataRepository): Promise<Settings> {
	const saved = await repo.load()
	return saved ?? getDefaultSettingForDevice()
}
