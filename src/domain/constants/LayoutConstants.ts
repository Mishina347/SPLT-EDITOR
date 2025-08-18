/**
 * レイアウト機能に関する基本定数
 * ドメイン層: アプリケーション全体のレイアウトルール
 */
export const LAYOUT_CONSTANTS = {
	// ドラッグ可能コンテナのサイズ制限
	DRAGGABLE_CONTAINER: {
		MIN_SIZE: {
			WIDTH: 200,
			HEIGHT: 150,
		},
		MAX_SIZE: {
			WIDTH: 1200,
			HEIGHT: 1000,
		},
		DEFAULT_SIZE: {
			WIDTH: 400,
			HEIGHT: 300,
		},
	},

	// 初期配置位置
	INITIAL_POSITION: {
		EDITOR: { x: 20, y: 100 },
		PREVIEW: { x: 540, y: 100 },
		DEFAULT_OFFSET: { x: 20, y: 20 },
	},

	// デフォルトサイズ
	DEFAULT_SIZE: {
		EDITOR: { width: 500, height: 400 },
		PREVIEW: { width: 500, height: 400 },
	},

	// リサイザー設定
	RESIZER: {
		INITIAL_SIZE: 50, // %
		MIN_SIZE: 20, // %
		MAX_SIZE: 80, // %
	},

	// ピンチズーム設定
	PINCH_ZOOM: {
		MIN_SCALE: 0.5,
		MAX_SCALE: 3.0,
		DEFAULT_SCALE: 1.0,
	},
} as const

export type LayoutConstants = typeof LAYOUT_CONSTANTS
