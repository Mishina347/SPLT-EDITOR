/**
 * カラー・テーマに関する定数
 * プレゼンテーション層: 色彩設計に関わる値
 */
export const COLOR_CONSTANTS = {
	// アルファ値設定
	ALPHA: {
		BUTTON_BACKGROUND: 0.15,
		HOVER_OVERLAY: 0.1,
		ACTIVE_OVERLAY: 0.2,
		FOCUS_RING: 0.3,
		PINCH_SHADOW: 0.4,
	},

	// RGB値の基準
	HEX: {
		SLICE_RED: { start: 1, end: 3 },
		SLICE_GREEN: { start: 3, end: 5 },
		SLICE_BLUE: { start: 5, end: 7 },
	},

	// 基数変換
	RADIX: {
		HEX: 16,
	},

	// Shadow設定
	SHADOW: {
		BOX_SHADOW: {
			SMALL: '0 2px 4px',
			MEDIUM: '0 4px 12px',
			LARGE: '0 8px 24px',
			EXTRA_LARGE: '0 12px 40px',
		},
		OPACITY: {
			SUBTLE: 0.1,
			NORMAL: 0.15,
			STRONG: 0.3,
		},
	},
} as const

export type ColorConstants = typeof COLOR_CONSTANTS
