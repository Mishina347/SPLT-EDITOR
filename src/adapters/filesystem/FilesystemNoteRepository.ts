import type { Note } from '../../domain/editor/EditorSetting'
import type { NoteRepository } from '../../gateways/NoteRepository'
import { invoke } from '@tauri-apps/api/core'
import { isTauri } from '../../utils'

export class FilesystemNoteRepository implements NoteRepository {
	async save(note: Note): Promise<void> {
		const filename = `${note.id}.json`
		const content = JSON.stringify(note)

		if (isTauri()) {
			await invoke('save_note', { filename, content })
		} else {
			// ブラウザ環境 → localStorage に保存
			localStorage.setItem(filename, content)
		}
	}

	async load(id: string): Promise<Note | null> {
		const filename = `${id}.json`

		if (isTauri()) {
			try {
				const content = await invoke<string>('load_note', { filename })
				return JSON.parse(content) as Note
			} catch (e) {
				// ファイルがなければnullを返す
				return null
			}
		} else {
			// ブラウザ環境 → localStorage から読み込み
			try {
				const content = localStorage.getItem(filename)
				return content ? (JSON.parse(content) as Note) : null
			} catch (e) {
				return null
			}
		}
	}

	// listやdeleteは必要に応じてRust側に対応コマンドを追加してください
	async list(): Promise<Note[]> {
		if (isTauri()) {
			// 未実装：Rust側コマンドの実装が必要
			return []
		} else {
			// ブラウザ環境 → localStorage から全ノートを取得
			const notes: Note[] = []
			for (let i = 0; i < localStorage.length; i++) {
				const key = localStorage.key(i)
				if (key && key.endsWith('.json')) {
					try {
						const content = localStorage.getItem(key)
						if (content) {
							const note = JSON.parse(content) as Note
							notes.push(note)
						}
					} catch (e) {
						// パースエラーは無視
					}
				}
			}
			return notes
		}
	}

	async delete(id: string): Promise<void> {
		const filename = `${id}.json`

		if (isTauri()) {
			// 未実装：Rust側に削除コマンドを実装しinvokeで呼び出してください
		} else {
			// ブラウザ環境 → localStorage から削除
			localStorage.removeItem(filename)
		}
	}
}
