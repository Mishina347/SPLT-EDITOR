/**
 * ファイルパスからファイル名を取得するユーティリティ関数
 */

/**
 * ファイルパスからファイル名を取得する
 * @param filePath ファイルパス（null/undefinedの場合は"untitled"を返す）
 * @param options オプション設定
 * @returns ファイル名（拡張子を含む）
 */
export const getFileName = (
	filePath: string | null | undefined,
	options?: {
		removeExtension?: boolean // 拡張子を除去するかどうか（デフォルト: false）
		defaultName?: string // ファイルパスがない場合のデフォルト名（デフォルト: "untitled"）
	}
): string => {
	const { removeExtension = false, defaultName = 'untitled' } = options || {}

	if (!filePath) {
		return defaultName
	}

	// パスからファイル名を抽出
	const fileName = filePath.split(/[/\\]/).pop() || filePath

	// 拡張子を除去する場合
	if (removeExtension) {
		const nameWithoutExtension = fileName.replace(/\.[^/.]+$/, '')
		return nameWithoutExtension || defaultName
	}

	return fileName
}
