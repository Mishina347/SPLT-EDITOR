export interface DocxExportSettings {
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
}

export const DEFAULT_DOCX_SETTINGS: DocxExportSettings = {
	pageSize: 'A4',
	orientation: 'landscape',
	margins: {
		top: 25,
		right: 25,
		bottom: 25,
		left: 25,
	},
	verticalWriting: true,
	font: {
		family: '游明朝',
		size: 12,
	},
	lineSpacing: 1.5,
}
