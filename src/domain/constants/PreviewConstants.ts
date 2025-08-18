export const PREVIEW_CONSTANTS = {
	CHARS_PER_LINE: {
		MIN: 10,
		MAX: 40,
		DEFAULT: 40,
		STEP: 1,
	},

	// 1ページあたりの行数制限
	LINES_PER_PAGE: {
		MIN: 5,
		MAX: 100,
		DEFAULT: 20,
		STEP: 1,
	},

	// 履歴保存数
	HISTORY: {
		MAX_SNAPSHOTS: 20,
		AUTO_SAVE_DELAY: 1000, // ms
	},

	// スワイプ検出設定
	SWIPE: {
		THRESHOLD: 50, // 最小スワイプ距離 (px)
		VERTICAL_THRESHOLD: 100, // 縦方向の最大許容距離 (px)
	},
} as const

export type PreviewConstants = typeof PREVIEW_CONSTANTS
