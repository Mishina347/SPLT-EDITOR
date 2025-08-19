import { wordCounter } from '../../utils/wordCounter'

export function calculateCharCount(text: string): {
	characterCount: number
	lineCount: number
	pageCount: number
} {
	// グラフェムクラスター（絵文字や結合文字を含む）の正確なカウント
	return wordCounter(text)
}
