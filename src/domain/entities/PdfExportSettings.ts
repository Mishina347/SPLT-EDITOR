export interface PdfExportSettings {
	// ページ設定
	pageSize: 'A4' | 'A5' | 'B5' | 'B6'
	orientation: 'portrait' | 'landscape'

	// 余白設定（ミリメートル）
	margins: {
		top: number
		right: number
		bottom: number
		left: number
	}

	// 縦書き設定
	verticalWriting: boolean

	// フォント設定
	font: {
		family: string
		size: number
	}

	// 行間設定
	lineSpacing: number

	// アウトライン設定
	outline: {
		enabled: boolean
		showPageNumbers: boolean
		showLineNumbers: boolean
		indentLevels: number
	}

	// レイアウト設定
	layout: {
		columns: number
		columnGap: number
		headerHeight: number
		footerHeight: number
	}
}

export const DEFAULT_PDF_SETTINGS: PdfExportSettings = {
	pageSize: 'A4',
	orientation: 'landscape', // 縦書き用の横向き
	margins: {
		top: 30,
		right: 25,
		bottom: 30,
		left: 25,
	},
	verticalWriting: true,
	font: {
		family: 'NotoSerifJP', // 埋め込みフォント
		size: 12,
	},
	lineSpacing: 1.2,
	outline: {
		enabled: true,
		showPageNumbers: true,
		showLineNumbers: true,
		indentLevels: 3,
	},
	layout: {
		columns: 1,
		columnGap: 10,
		headerHeight: 20,
		footerHeight: 20,
	},
}

// 利用可能な埋め込みフォント
export const EMBEDDED_FONTS = ['NotoSerifJP'] as const

export type EmbeddedFont = (typeof EMBEDDED_FONTS)[number]
