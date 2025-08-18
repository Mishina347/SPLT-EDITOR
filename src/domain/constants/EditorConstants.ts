/**
 * エディター機能に関する基本定数
 * ドメイン層: ビジネスルールに関わる値
 */
export const EDITOR_CONSTANTS = {
	// フォントサイズ制限
	FONT_SIZE: {
		MIN: 8,
		MAX: 32,
		DEFAULT: 14,
		STEP: 1,
	},

	// 1行あたりの文字数制限
	CHARS_PER_LINE: {
		MIN: 10,
		MAX: 100,
		DEFAULT: 40,
		STEP: 1,
	},
}

export type EditorConstants = typeof EDITOR_CONSTANTS
