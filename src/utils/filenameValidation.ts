/**
 * ファイル名のバリデーション機能
 */

// 無効な文字のパターン
const INVALID_CHARS_REGEX = /[<>:"/\\|?*\x00-\x1f]/

// Windowsで予約されているファイル名
const RESERVED_NAMES = [
	'CON',
	'PRN',
	'AUX',
	'NUL',
	'COM1',
	'COM2',
	'COM3',
	'COM4',
	'COM5',
	'COM6',
	'COM7',
	'COM8',
	'COM9',
	'LPT1',
	'LPT2',
	'LPT3',
	'LPT4',
	'LPT5',
	'LPT6',
	'LPT7',
	'LPT8',
	'LPT9',
]

export interface FilenameValidationResult {
	isValid: boolean
	error?: string
	suggestedFilename?: string
}

/**
 * ファイル名をバリデーションする
 * @param filename バリデーションするファイル名
 * @returns バリデーション結果
 */
export function validateFilename(filename: string): FilenameValidationResult {
	// 空文字チェック
	if (!filename || filename.trim() === '') {
		return {
			isValid: false,
			error: 'ファイル名を入力してください',
			suggestedFilename: 'document.txt',
		}
	}

	const trimmedFilename = filename.trim()

	// 長さチェック（Windowsの制限: 255文字）
	if (trimmedFilename.length > 255) {
		return {
			isValid: false,
			error: 'ファイル名が長すぎます（255文字以内）',
			suggestedFilename: trimmedFilename.substring(0, 250) + '.txt',
		}
	}

	// 無効な文字チェック
	if (INVALID_CHARS_REGEX.test(trimmedFilename)) {
		const cleanedFilename = trimmedFilename.replace(INVALID_CHARS_REGEX, '_')
		return {
			isValid: false,
			error: 'ファイル名に使用できない文字が含まれています',
			suggestedFilename: cleanedFilename,
		}
	}

	// 予約名チェック（大文字小文字を区別しない）
	const nameWithoutExt = trimmedFilename.split('.')[0].toUpperCase()
	if (RESERVED_NAMES.includes(nameWithoutExt)) {
		return {
			isValid: false,
			error: 'このファイル名は使用できません',
			suggestedFilename: trimmedFilename + '_copy.txt',
		}
	}

	// 先頭・末尾のドットチェック
	if (trimmedFilename.startsWith('.') || trimmedFilename.endsWith('.')) {
		return {
			isValid: false,
			error: 'ファイル名はドットで始まったり終わったりできません',
			suggestedFilename: trimmedFilename.replace(/^\.+|\.+$/g, '') + '.txt',
		}
	}

	// スペースのみチェック
	if (trimmedFilename.replace(/\s/g, '') === '') {
		return {
			isValid: false,
			error: 'ファイル名に有効な文字を入力してください',
			suggestedFilename: 'document.txt',
		}
	}

	// 拡張子チェック（.txtが含まれていない場合は追加）
	if (!trimmedFilename.toLowerCase().endsWith('.txt')) {
		return {
			isValid: true,
			suggestedFilename: trimmedFilename + '.txt',
		}
	}

	return {
		isValid: true,
	}
}

/**
 * ファイル名をサニタイズする
 * @param filename サニタイズするファイル名
 * @returns サニタイズされたファイル名
 */
export function sanitizeFilename(filename: string): string {
	return (
		filename
			.trim()
			.replace(INVALID_CHARS_REGEX, '_')
			.replace(/^\.+|\.+$/g, '')
			.replace(/\s+/g, ' ') || 'document'
	)
}

/**
 * デフォルトファイル名を生成する
 * @param prefix プレフィックス（オプション）
 * @returns デフォルトファイル名
 */
export function generateDefaultFilename(prefix?: string): string {
	const timestamp = new Date().toISOString().slice(0, 19).replace(/[:-]/g, '')
	const baseName = prefix ? `${prefix}_${timestamp}` : `document_${timestamp}`
	return `${baseName}.txt`
}
