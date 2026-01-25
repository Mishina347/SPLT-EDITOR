import { invoke } from '@tauri-apps/api/core'
import { isTauri } from '@/utils'

export interface SavedFile {
	filePath: string
	fileName: string
	fileHandle?: FileSystemFileHandle // ブラウザ環境でのファイルハンドル
}

// ブラウザ環境でのファイルハンドルを保存（セッション中のみ有効）
// loadTextFile.tsと共有するため、exportして使用
export let browserFileHandle: FileSystemFileHandle | null = null

/**
 * ブラウザ環境でのファイルハンドルを設定（loadTextFile.tsから使用）
 */
export const setBrowserFileHandle = (handle: FileSystemFileHandle | null): void => {
	browserFileHandle = handle
}

/**
 * ファイル保存ダイアログを開いてファイルを保存する
 * @param content 保存するテキスト内容
 * @param defaultFileName デフォルトのファイル名（オプション）
 * @returns 保存されたファイルのパスとファイル名
 */
export const saveTextFile = async (
	content: string,
	defaultFileName?: string
): Promise<SavedFile> => {
	if (isTauri()) {
		try {
			const filePath = await invoke<string>('saveTextFile', { content })
			const fileName = filePath.split(/[/\\]/).pop() || 'untitled.txt'
			return {
				filePath,
				fileName,
			}
		} catch (error) {
			if (error instanceof Error && error.message.includes('キャンセル')) {
				throw new Error('ファイル保存がキャンセルされました')
			}
			throw new Error(`ファイルの保存に失敗しました: ${error}`)
		}
	} else {
		// ブラウザ環境 → File System Access APIを使用
		try {
			// File System Access APIが利用可能かチェック
			if ('showSaveFilePicker' in window) {
				const suggestedFileName = defaultFileName || 'untitled.txt'
				console.log('saveTextFile: Opening save dialog', { suggestedFileName })
				const fileHandle = await (window as any).showSaveFilePicker({
					suggestedName: suggestedFileName,
					types: [
						{
							description: 'テキストファイル',
							accept: {
								'text/plain': ['.txt', '.md', '.json', '.js', '.ts', '.jsx', '.tsx', '.html', '.css', '.xml'],
							},
						},
					],
				})

				// ファイルに書き込み
				const writable = await fileHandle.createWritable()
				await writable.write(content)
				await writable.close()

				// ファイルハンドルを保存（重要：上書き保存用）
				browserFileHandle = fileHandle
				console.log('saveTextFile: File handle saved', fileHandle.name, 'Handle:', browserFileHandle)

				const savedFileName = fileHandle.name
				return {
					filePath: savedFileName,
					fileName: savedFileName,
					fileHandle,
				}
			} else {
				// File System Access APIが利用できない場合のフォールバック
				return new Promise((resolve, reject) => {
					const fallbackFileName = defaultFileName || 'untitled.txt'
					const blob = new Blob([content], { type: 'text/plain;charset=utf-8' })
					const url = URL.createObjectURL(blob)
					const link = document.createElement('a')
					link.href = url
					link.download = fallbackFileName
					link.style.display = 'none'
					document.body.appendChild(link)
					link.click()
					document.body.removeChild(link)
					URL.revokeObjectURL(url)

					// ブラウザ環境ではファイルパスはファイル名と同じ
					resolve({
						filePath: fallbackFileName,
						fileName: fallbackFileName,
					})
				})
			}
		} catch (error: any) {
			// ユーザーがキャンセルした場合
			if (error.name === 'AbortError') {
				throw new Error('ファイル保存がキャンセルされました')
			}
			throw new Error(`ファイルの保存に失敗しました: ${error.message || error}`)
		}
	}
}

/**
 * 既存のファイルパスに保存する
 * @param filePath 保存先のファイルパス（またはファイルハンドル）
 * @param content 保存するテキスト内容
 */
export const saveToExistingFile = async (filePath: string, content: string): Promise<void> => {
	if (isTauri()) {
		try {
			const { invoke } = await import('@tauri-apps/api/core')
			// Tauriコマンドを使用して既存ファイルに保存
			console.log('saveToExistingFile: Saving to', filePath, 'Content length:', content.length)
			await invoke('saveToExistingFile', {
				filePath,
				content,
			})
			console.log('saveToExistingFile: Successfully saved')
		} catch (error) {
			console.error('saveToExistingFile error:', error)
			throw new Error(`ファイルの保存に失敗しました: ${error}`)
		}
	} else {
		// ブラウザ環境 → File System Access APIを使用
		try {
			console.log('saveToExistingFile: Browser environment', {
				hasFileHandle: !!browserFileHandle,
				filePath,
				contentLength: content.length,
			})

			if (browserFileHandle) {
				// 保存されたファイルハンドルを使用して上書き保存
				console.log('saveToExistingFile: Using saved file handle', browserFileHandle.name)
				const writable = await browserFileHandle.createWritable()
				await writable.write(content)
				await writable.close()
				console.log('saveToExistingFile: Successfully saved using file handle')
			} else {
				// ファイルハンドルがない場合、エラーを投げる
				// （初回保存時はsaveTextFileを使用すべき）
				console.warn('saveToExistingFile: No file handle found, cannot overwrite')
				throw new Error('ファイルハンドルが見つかりません。初回保存を行ってください。')
			}
		} catch (error: any) {
			if (error.name === 'AbortError') {
				throw new Error('ファイル保存がキャンセルされました')
			}
			console.error('saveToExistingFile error:', error)
			throw new Error(`ファイルの保存に失敗しました: ${error.message || error}`)
		}
	}
}

/**
 * ブラウザ環境でのファイルハンドルをクリア（新しいファイルを開く際など）
 */
export const clearBrowserFileHandle = (): void => {
	browserFileHandle = null
}
