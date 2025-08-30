import { Settings } from '../domain'

export interface FileDataRepository {
	load(): Promise<Settings | null>
	save(settings: Settings): Promise<void>
}
