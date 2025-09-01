import { invoke } from '@tauri-apps/api/core'
import { isTauri } from '@/utils'

export interface LoadedFile {
	content: string
	fileName: string
}

/**
 * 外部テキストファイルを読み込む
 * @returns 読み込んだファイルの内容とファイル名
 */
export const loadTextFile = async (): Promise<LoadedFile> => {
	if (isTauri()) {
		try {
			const result = await invoke<[string, string]>('open_text_file')
			return {
				content: result[0],
				fileName: result[1],
			}
		} catch (error) {
			throw new Error(`ファイルの読み込みに失敗しました: ${error}`)
		}
	} else {
		// ブラウザ環境 → ファイル選択ダイアログを使用
		return new Promise((resolve, reject) => {
			const input = document.createElement('input')
			input.type = 'file'
			input.accept = '.txt,.md,.json,.js,.ts,.jsx,.tsx,.html,.css,.xml,text/*'

			input.onchange = event => {
				const target = event.target as HTMLInputElement
				const file = target.files?.[0]

				if (!file) {
					reject(new Error('ファイルが選択されませんでした'))
					return
				}

				const reader = new FileReader()
				reader.onload = e => {
					const content = e.target?.result as string
					resolve({
						content,
						fileName: file.name,
					})
				}
				reader.onerror = () => {
					reject(new Error('ファイルの読み込みに失敗しました'))
				}
				reader.readAsText(file, 'utf-8')
			}

			input.oncancel = () => {
				reject(new Error('ファイル選択がキャンセルされました'))
			}

			input.click()
		})
	}
}
