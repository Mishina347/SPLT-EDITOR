/**
 * 数値の三桁ごとにカンマを付けるフォーマッター
 * @param value - フォーマット対象の数値または文字列
 * @param options - フォーマットオプション
 * @returns フォーマットされた文字列
 */
export const formatNumber = (
	value: number | string,
	options: {
		/** 小数点以下の桁数（デフォルト: 0） */
		decimals?: number
		/** 小数点の文字（デフォルト: '.'） */
		decimalSeparator?: string
		/** 千の位の区切り文字（デフォルト: ','） */
		thousandsSeparator?: string
		/** 負の値の処理方法（デフォルト: 'preserve'） */
		negativeHandling?: 'preserve' | 'absolute' | 'brackets'
	} = {}
): string => {
	const {
		decimals = 0,
		decimalSeparator = '.',
		thousandsSeparator = ',',
		negativeHandling = 'preserve',
	} = options

	// 数値に変換
	let numValue: number
	if (typeof value === 'string') {
		numValue = parseFloat(value)
		if (isNaN(numValue)) {
			return value // 数値に変換できない場合は元の値を返す
		}
	} else {
		numValue = value
	}

	// 負の値の処理
	let isNegative = false
	if (numValue < 0) {
		isNegative = true
		switch (negativeHandling) {
			case 'absolute':
				numValue = Math.abs(numValue)
				break
			case 'brackets':
				numValue = Math.abs(numValue)
				break
			case 'preserve':
			default:
				// そのまま保持
				break
		}
	}

	// 小数点以下の処理
	const fixedValue = numValue.toFixed(decimals)
	const [integerPart, decimalPart] = fixedValue.split('.')

	// 整数部分に三桁ごとの区切りを追加
	const formattedInteger = integerPart.replace(/\B(?=(\d{3})+(?!\d))/g, thousandsSeparator)

	// 結果を組み立て
	let result = formattedInteger
	if (decimalPart && decimals > 0) {
		result += decimalSeparator + decimalPart
	}

	// 負の値の処理
	if (isNegative) {
		switch (negativeHandling) {
			case 'brackets':
				return `(${result})`
			case 'absolute':
				return result
			case 'preserve':
			default:
				return `-${result}`
		}
	}

	return result
}

/**
 * パーセンテージ形式で数値をフォーマット
 * @param value - フォーマット対象の数値（0-1の範囲）
 * @param options - フォーマットオプション
 * @returns パーセンテージ形式の文字列
 */
export const formatPercentage = (
	value: number,
	options: {
		decimals?: number
		decimalSeparator?: string
		thousandsSeparator?: string
		negativeHandling?: 'preserve' | 'absolute' | 'brackets'
	} = {}
): string => {
	const percentageValue = value * 100
	const formattedNumber = formatNumber(percentageValue, options)
	return `${formattedNumber}%`
}

/**
 * ファイルサイズ形式で数値をフォーマット
 * @param bytes - バイト数
 * @param options - フォーマットオプション
 * @returns ファイルサイズ形式の文字列
 */
export const formatBytes = (
	bytes: number,
	options: {
		/** 小数点以下の桁数（デフォルト: 2） */
		decimals?: number
		/** 単位の表示方法（デフォルト: 'short'） */
		unitStyle?: 'short' | 'long'
	} = {}
): string => {
	const { decimals = 2, unitStyle = 'short' } = options

	const units =
		unitStyle === 'short'
			? ['B', 'KB', 'MB', 'GB', 'TB', 'PB']
			: ['Bytes', 'Kilobytes', 'Megabytes', 'Gigabytes', 'Terabytes', 'Petabytes']

	if (bytes === 0) {
		return `0 ${units[0]}`
	}

	const k = 1024
	const i = Math.floor(Math.log(bytes) / Math.log(k))
	const size = bytes / Math.pow(k, i)

	return `${formatNumber(size, { decimals })} ${units[i]}`
}

/**
 * 数値の範囲をチェックして、指定された範囲内に収める
 * @param value - 対象の数値
 * @param min - 最小値
 * @param max - 最大値
 * @returns 範囲内に収められた数値
 */
export const clampNumber = (value: number, min: number, max: number): number => {
	return Math.min(Math.max(value, min), max)
}

/**
 * 数値が指定された範囲内にあるかチェック
 * @param value - 対象の数値
 * @param min - 最小値
 * @param max - 最大値
 * @returns 範囲内にある場合はtrue
 */
export const isInRange = (value: number, min: number, max: number): boolean => {
	return value >= min && value <= max
}
