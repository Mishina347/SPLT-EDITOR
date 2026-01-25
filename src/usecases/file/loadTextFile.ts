import { invoke } from '@tauri-apps/api/core'
import { isTauri } from '@/utils'
import { setBrowserFileHandle } from './saveTextFile'

export interface LoadedFile {
	content: string
	fileName: string
	filePath?: string // Tauri環境では完全なファイルパス、ブラウザ環境では未定義
}

/**
 * 外部テキストファイルを読み込む
 * @returns 読み込んだファイルの内容とファイル名
 */
export const loadTextFile = async (): Promise<LoadedFile> => {
	if (isTauri()) {
		try {
			// タイムアウトを設定（30秒）
			const timeoutPromise = new Promise<never>((_, reject) => {
				setTimeout(() => {
					reject(new Error('ファイル選択がタイムアウトしました'))
				}, 30000)
			})

			const result = await Promise.race([
				invoke<[string, string, string]>('openTextFile'),
				timeoutPromise,
			])

			return {
				content: result[0],
				fileName: result[1],
				filePath: result[2], // 完全なファイルパス
			}
		} catch (error: any) {
			// キャンセルやタイムアウトのエラーを適切に処理
			if (error?.message?.includes('キャンセル') || error?.message?.includes('タイムアウト')) {
				throw error
			}
			throw new Error(`ファイルの読み込みに失敗しました: ${error}`)
		}
	} else {
		// ブラウザ環境 → File System Access APIを使用
		try {
			// File System Access APIが利用可能かチェック
			if ('showOpenFilePicker' in window) {
				const [fileHandle] = await (window as any).showOpenFilePicker({
					types: [
						{
							description: 'テキストファイル',
							accept: {
								'text/plain': ['.txt', '.md', '.json', '.js', '.ts', '.jsx', '.tsx', '.html', '.css', '.xml'],
							},
						},
					],
					multiple: false,
				})

				const file = await fileHandle.getFile()
				const content = await file.text()

				// ファイルハンドルを保存（上書き保存用）
				setBrowserFileHandle(fileHandle)
				console.log('loadTextFile: File handle saved', fileHandle.name)

				return {
					content,
					fileName: file.name,
				}
			} else {
				// File System Access APIが利用できない場合のフォールバック
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
		} catch (error: any) {
			if (error.name === 'AbortError') {
				throw new Error('ファイル選択がキャンセルされました')
			}
			throw new Error(`ファイルの読み込みに失敗しました: ${error.message || error}`)
		}
	}
}
