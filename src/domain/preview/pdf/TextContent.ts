export type TextContent = {
	text: string
}

export type LayoutConfig = {
	charsPerLine: number
	linesPerPage: number
}

// 禁則文字をSetに変換して高速検索を実現
const KINSOKU_ATAMA_SET = new Set([
	'、',
	'。',
	'」',
	'』',
	'）',
	'】',
	'ぁ',
	'ぃ',
	'ぅ',
	'ぇ',
	'ぉ',
	'っ',
	'ゃ',
	'ゅ',
	'ょ',
	'ァ',
	'ィ',
	'ゥ',
	'ェ',
	'ォ',
	'ッ',
	'ャ',
	'ュ',
	'ョ',
	'ー',
])

const KINSOKU_MATSUBI_SET = new Set(['「', '『', '（', '【'])

// 後方互換性のためexport
export const KINSOKU_ATAMA = Array.from(KINSOKU_ATAMA_SET)
export const KINSOKU_MATSUBI = Array.from(KINSOKU_MATSUBI_SET)

export function applyKinsoku(text: string, charsPerLine: number): string[] {
	const result: string[] = []
	let line = ''

	for (let i = 0; i < text.length; i++) {
		const char = text[i]

		// 改行の処理（空行もそのまま反映）
		if (char === '\n' || char === '\r\n') {
			result.push(line)
			line = '\n'
			continue
		}

		// 行頭禁則処理（Setを使用して高速検索）
		if (line.length === 0 && KINSOKU_ATAMA_SET.has(char) && result.length > 0) {
			result[result.length - 1] += char
			continue
		}

		// 行末禁則処理（Setを使用して高速検索）
		if (line.length === charsPerLine - 1 && KINSOKU_MATSUBI_SET.has(char)) {
			line += char
			result.push(line)
			line = ''
			continue
		}

		// 通常文字
		line += char

		if (line.length === charsPerLine) {
			result.push(line)
			line = ''
		}
	}

	if (line) result.push(line)
	return result
}
