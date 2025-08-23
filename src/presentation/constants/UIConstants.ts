/**
 * UI表示に関する定数
 * プレゼンテーション層: 具体的な画面表示・操作に関わる値
 */
export const UI_CONSTANTS = {
	// リサイズハンドルのサイズ
	RESIZE_HANDLE: {
		// 通常サイズ
		EDGE: {
			THICKNESS: 4, // px
			OFFSET: -2, // px
		},
		CORNER: {
			SIZE: 8, // px
			OFFSET: -4, // px
			BORDER_RADIUS: 50, // %
		},

		// タッチデバイス用拡大サイズ
		TOUCH: {
			EDGE_THICKNESS: 8, // px
			EDGE_OFFSET: -4, // px
			CORNER_SIZE: 12, // px
			CORNER_OFFSET: -6, // px
		},

		// フォーカス時のシャドウ
		FOCUS_SHADOW: {
			BLUR: 0,
			SPREAD: 2, // px
			COLOR: 'rgba(59, 130, 246, 0.5)',
		},
	},

	// ツールバーの設定
	TOOLBAR: {
		ANIMATION_DELAY: 100, // ms
		MIN_HEIGHT: 44, // px (タッチデバイス対応)
	},

	// タッチデバイス対応
	TOUCH_TARGET: {
		MIN_SIZE: 44, // px (WCAG準拠)
		PADDING: 12, // px
	},

	// アニメーション設定
	ANIMATION: {
		DURATION: {
			SHORT: 100, // ms
			MEDIUM: 200, // ms
			LONG: 300, // ms
		},
		EASING: {
			EASE_OUT: 'ease-out',
			EASE_IN_OUT: 'ease-in-out',
		},
	},

	// Z-Index階層
	Z_INDEX: {
		BASE: 1,
		MAXIMIZED: 100,
		DRAGGING: 1000,
		DIALOG: 9999,
	},

	// ドラッグ可能コンテナのデフォルト値
	DRAGGABLE_CONTAINER: {
		DEFAULT_POSITION: { x: 20, y: 20 },
		DEFAULT_SIZE: { width: 400, height: 300 },
		MIN_SIZE: { width: 120, height: 90 },
		MAX_SIZE: { width: 1600, height: 1200 },
	},
} as const

export type UIConstants = typeof UI_CONSTANTS
