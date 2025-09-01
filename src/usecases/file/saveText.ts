import { appDataDir } from '@tauri-apps/api/path'
import { isTauri } from '@/utils'

export const saveText = async (fileName: string, text: string) => {
	if (isTauri()) {
		// Tauri API を動的 import
		const { writeTextFile } = await import('@tauri-apps/plugin-fs')
		const dir = await appDataDir()
		return await writeTextFile(`${dir}/${fileName}`, text)
	} else {
		// ブラウザ環境 → localStorage に保存
		localStorage.setItem(fileName, text)
		return Promise.resolve()
	}
}
