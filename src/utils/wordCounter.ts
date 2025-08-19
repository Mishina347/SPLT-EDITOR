export function countGrapheme(text: string): number {
	if (!text) return 0

	// Intl.Segmenterが利用可能かチェック
	if (typeof Intl !== 'undefined' && Intl.Segmenter) {
		const segmenter = new Intl.Segmenter('ja', { granularity: 'grapheme' })
		return [...segmenter.segment(text)].length
	}

	// フォールバック: 基本的なUnicodeサロゲートペア対応
	return countGraphemeFallback(text)
}

function countGraphemeFallback(text: string): number {
	let count = 0
	let i = 0

	while (i < text.length) {
		const codePoint = text.codePointAt(i)
		if (codePoint && codePoint > 0xffff) {
			// サロゲートペア（絵文字など）
			i += 2
		} else {
			i += 1
		}
		count++
	}

	return count
}

// 文字処理の高速化用キャッシュ
const charProcessingCache = new Map<string, string>()
const punctuationChars = new Set(['。', '、', '」'])
const indentChars = new Set(['　', '「'])

/**
 * 文字の処理をキャッシュ化して高速化
 * @param char 文字
 * @returns 処理後の文字
 */
function processCharFast(char: string): string {
	if (charProcessingCache.has(char)) {
		return charProcessingCache.get(char)!
	}

	let result = char

	// 数字の処理（2桁→1文字扱い）
	if (/\d{2}/.test(char)) {
		result = '0'
	}
	// 英語の処理（2文字→1文字扱い）
	else if (/[a-zA-Z]{2}/.test(char)) {
		result = 'a'
	}

	charProcessingCache.set(char, result)
	return result
}

/**
 * 詳細な原稿用紙計算（最適化版）
 * @param text テキスト
 * @returns 原稿用紙の行数
 */
export function calculateDetailedManuscriptLines(text: string): number {
	if (!text) return 1

	let lines = 0
	let currentPos = 0
	const textLength = text.length

	while (currentPos < textLength) {
		// 改行までの1行を取得
		let lineEnd = text.indexOf('\n', currentPos)
		if (lineEnd === -1) lineEnd = textLength

		const lineText = text.slice(currentPos, lineEnd)
		currentPos = lineEnd + 1

		if (lineText.length === 0) {
			// 空行
			lines++
			continue
		}

		// 行頭の字下げ処理を高速化
		const firstChar = lineText.charAt(0)
		const needsIndent = !indentChars.has(firstChar)

		// 文字列の連結を避けて、仮想的な文字数で計算
		let virtualLength = lineText.length + (needsIndent ? 1 : 0)

		// 句読点処理の最適化（。」→」の置換効果を考慮）
		let punctuationReductions = 0
		for (let i = 0; i < lineText.length - 1; i++) {
			if (lineText.charAt(i) === '。' && lineText.charAt(i + 1) === '」') {
				punctuationReductions++
			}
		}
		virtualLength -= punctuationReductions

		// 数字・英語処理の最適化
		let compressionSavings = 0
		for (let i = 0; i < lineText.length - 1; i++) {
			const twoChar = lineText.substr(i, 2)
			if (/\d{2}/.test(twoChar) || /[a-zA-Z]{2}/.test(twoChar)) {
				compressionSavings++
				i++ // 2文字処理したので次をスキップ
			}
		}
		virtualLength -= compressionSavings

		// 21文字単位での行分割計算
		const charsPerLine = 21
		let processedChars = 0

		while (processedChars < virtualLength) {
			lines++
			const lineStartPos = processedChars
			const lineEndPos = Math.min(processedChars + charsPerLine, virtualLength)

			// 行末が句読点かどうかの判定（簡略化）
			if (lineEndPos < virtualLength) {
				// 実際の文字位置を逆算して判定
				const actualPos = Math.min(
					lineStartPos + charsPerLine - (needsIndent ? 1 : 0),
					lineText.length - 1
				)
				const endChar = lineText.charAt(actualPos)

				if (punctuationChars.has(endChar)) {
					processedChars = lineEndPos
				} else {
					processedChars = Math.max(lineEndPos - 1, lineStartPos + 1)
				}
			} else {
				processedChars = lineEndPos
			}
		}
	}

	return Math.max(lines, 1)
}

export function wordCounter(text: string) {
	// 改行を除いたテキストのグラフェムカウント
	const characterCount = countGrapheme(text.replace(/\n/g, ''))
	// 原稿用紙枚数の計算（行数を20で割ってページ数に変換）
	const manuscriptLines = calculateDetailedManuscriptLines(text)
	const manuscriptPages = Math.max(Math.ceil(manuscriptLines / 20), 1)

	return { characterCount, lineCount: manuscriptLines, pageCount: manuscriptPages }
}
