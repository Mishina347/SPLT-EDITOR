/**
 * 日付フォーマット関連のユーティリティ関数
 */

export interface DateFormatOptions {
	year?: 'numeric' | '2-digit'
	month?: 'numeric' | '2-digit' | 'long' | 'short' | 'narrow'
	day?: 'numeric' | '2-digit'
	hour?: 'numeric' | '2-digit'
	minute?: 'numeric' | '2-digit'
	second?: 'numeric' | '2-digit'
	timeZone?: string
	locale?: string
}

/**
 * 日付を指定されたフォーマットで文字列に変換
 */
export const formatDate = (
	date: Date,
	options: DateFormatOptions = {},
	locale: string = 'ja-JP'
): string => {
	const defaultOptions: Intl.DateTimeFormatOptions = {
		year: 'numeric',
		month: '2-digit',
		day: '2-digit',
		hour: '2-digit',
		minute: '2-digit',
	}

	const mergedOptions = { ...defaultOptions, ...options }

	try {
		return date.toLocaleString(locale, mergedOptions)
	} catch (error) {
		console.error('Date formatting error:', error)
		return date.toString()
	}
}

/**
 * タイムスタンプをフォーマット（履歴表示用）
 */
export const formatTimestamp = (date: Date): string => {
	return formatDate(date, {
		year: 'numeric',
		month: '2-digit',
		day: '2-digit',
		hour: '2-digit',
		minute: '2-digit',
	})
}

/**
 * 相対時間を表示（例：「2分前」）
 */
export const formatRelativeTime = (date: Date, locale: string = 'ja-JP'): string => {
	const now = new Date()
	const diffMs = now.getTime() - date.getTime()
	const diffMinutes = Math.floor(diffMs / (1000 * 60))
	const diffHours = Math.floor(diffMs / (1000 * 60 * 60))
	const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24))

	if (diffMinutes < 1) {
		return 'たった今'
	} else if (diffMinutes < 60) {
		return `${diffMinutes}分前`
	} else if (diffHours < 24) {
		return `${diffHours}時間前`
	} else if (diffDays < 7) {
		return `${diffDays}日前`
	} else {
		// 1週間以上前は日付を表示
		return formatTimestamp(date)
	}
}

/**
 * ファイルサイズをフォーマット
 */
export const formatFileSize = (bytes: number): string => {
	if (bytes === 0) return '0 B'

	const k = 1024
	const sizes = ['B', 'KB', 'MB', 'GB']
	const i = Math.floor(Math.log(bytes) / Math.log(k))

	return `${parseFloat((bytes / Math.pow(k, i)).toFixed(1))} ${sizes[i]}`
}

/**
 * 時間の経過を表示（例：「実行時間: 1.23秒」）
 */
export const formatDuration = (startTime: number, endTime?: number): string => {
	const end = endTime || Date.now()
	const durationMs = end - startTime

	if (durationMs < 1000) {
		return `${durationMs}ms`
	} else {
		return `${(durationMs / 1000).toFixed(2)}秒`
	}
}
