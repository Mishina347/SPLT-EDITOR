/**
 * テキスト検証関連のユーティリティ関数
 */

export interface ValidationResult {
	isValid: boolean
	errors: string[]
	warnings: string[]
}

/**
 * テキストの基本的な検証
 */
export const validateText = (text: string): ValidationResult => {
	const errors: string[] = []
	const warnings: string[] = []

	// 最大長チェック
	const MAX_LENGTH = 1000000 // 1MB相当
	if (text.length > MAX_LENGTH) {
		errors.push(`テキストが長すぎます（最大: ${MAX_LENGTH.toLocaleString()}文字）`)
	}

	// 不正な文字のチェック
	const invalidChars = /[\x00-\x08\x0B\x0C\x0E-\x1F\x7F]/g
	if (invalidChars.test(text)) {
		warnings.push('制御文字が含まれています')
	}

	// 連続する空行のチェック
	const consecutiveEmptyLines = /\n\s*\n\s*\n/g
	if (consecutiveEmptyLines.test(text)) {
		warnings.push('連続する空行が含まれています')
	}

	return {
		isValid: errors.length === 0,
		errors,
		warnings,
	}
}

/**
 * ファイル名の検証
 */
export const validateFileName = (fileName: string): ValidationResult => {
	const errors: string[] = []
	const warnings: string[] = []

	// 空文字チェック
	if (!fileName.trim()) {
		errors.push('ファイル名が空です')
		return { isValid: false, errors, warnings }
	}

	// 不正な文字のチェック
	const invalidChars = /[<>:"/\\|?*]/g
	if (invalidChars.test(fileName)) {
		errors.push('ファイル名に使用できない文字が含まれています')
	}

	// 長さチェック
	if (fileName.length > 255) {
		errors.push('ファイル名が長すぎます（最大: 255文字）')
	}

	// 予約語チェック（Windows）
	const reservedNames = /^(CON|PRN|AUX|NUL|COM[1-9]|LPT[1-9])(\.|$)/i
	if (reservedNames.test(fileName)) {
		errors.push('予約された名前は使用できません')
	}

	return {
		isValid: errors.length === 0,
		errors,
		warnings,
	}
}

/**
 * URLの検証
 */
export const validateUrl = (url: string): ValidationResult => {
	const errors: string[] = []
	const warnings: string[] = []

	try {
		new URL(url)
	} catch {
		errors.push('有効なURLではありません')
	}

	return {
		isValid: errors.length === 0,
		errors,
		warnings,
	}
}

/**
 * エディタ設定値の検証
 */
export const validateEditorSettings = (settings: {
	fontSize?: number
	wordWrapColumn?: number
}): ValidationResult => {
	const errors: string[] = []
	const warnings: string[] = []

	// フォントサイズの検証
	if (settings.fontSize !== undefined) {
		if (settings.fontSize < 8 || settings.fontSize > 72) {
			errors.push('フォントサイズは8〜72の範囲で設定してください')
		}
	}

	// 文字数の検証
	if (settings.wordWrapColumn !== undefined) {
		if (settings.wordWrapColumn < 10 || settings.wordWrapColumn > 200) {
			errors.push('一行あたりの文字数は10〜200の範囲で設定してください')
		}
	}

	return {
		isValid: errors.length === 0,
		errors,
		warnings,
	}
}

/**
 * 数値の範囲検証
 */
export const validateRange = (
	value: number,
	min: number,
	max: number,
	fieldName: string = '値'
): ValidationResult => {
	const errors: string[] = []
	const warnings: string[] = []

	if (value < min || value > max) {
		errors.push(`${fieldName}は${min}〜${max}の範囲で設定してください`)
	}

	return {
		isValid: errors.length === 0,
		errors,
		warnings,
	}
}
