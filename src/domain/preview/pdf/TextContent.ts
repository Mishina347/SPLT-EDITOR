export type TextContent = {
	text: string
}

export type LayoutConfig = {
	charsPerLine: number
	linesPerPage: number
	fontSize: number
	fontFamily: import('../../editor/EditorSetting').FontFamily
}

// 禁則文字をSetに変換して高速検索を実現
const KINSOKU_ATAMA_SET = new Set([
	// 句読点
	'、',
	'。',
	'，',
	'．',
	// 小書き文字
	'ぁ',
	'ぃ',
	'ぅ',
	'ぇ',
	'ぉ',
	'っ',
	'ゃ',
	'ゅ',
	'ょ',
	'ゎ',
	'ァ',
	'ィ',
	'ゥ',
	'ェ',
	'ォ',
	'ッ',
	'ャ',
	'ュ',
	'ョ',
	'ヮ',
	'ヵ',
	'ヶ',
	// 音引き
	'ー',
	// 括弧類の閉じ
	')',
	'）',
	']',
	'］',
	'}',
	'｝',
	'〉',
	'》',
	'」',
	'』',
	'〕',
	'〗',
	'〙',
	'〛',
	// 中点・長音類
	'・',
	'‥',
	'…',
	// その他の記号
	'!',
	'！',
	'?',
	'？',
	':',
	'：',
	';',
	'；',
	'%',
	'％',
	// 単位記号
	'°',
	'′',
	'″',
	'℃',
	'円',
	'￥',
	'$',
	'€',
])

const KINSOKU_MATSUBI_SET = new Set([
	// 括弧類の開き
	'(',
	'（',
	'[',
	'［',
	'{',
	'｛',
	'〈',
	'《',
	'「',
	'『',
	'〔',
	'〖',
	'〘',
	'〚',
	// 引用符
	'"',
	'"',
	`'`,
	"'",
	'｢',
])

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
