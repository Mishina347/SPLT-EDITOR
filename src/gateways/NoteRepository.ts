import type { Note } from '../domain/editor/EditorSetting'

export interface NoteRepository {
	save(note: Note): Promise<void>
	load(id: string): Promise<Note | null>
	list(): Promise<Note[]>
	delete(id: string): Promise<void>
}
