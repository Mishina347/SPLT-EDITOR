import { appDataDir } from '@tauri-apps/api/path'
import { isTauri } from '@/utils'

export const loadText = async (fileName: string): Promise<string> => {
	if (isTauri()) {
		try {
			const { readTextFile } = await import('@tauri-apps/plugin-fs')
			const dir = await appDataDir()
			return await readTextFile(`${dir}/${fileName}`)
		} catch {
			return ''
		}
	} else {
		return localStorage.getItem(fileName) || ''
	}
}
