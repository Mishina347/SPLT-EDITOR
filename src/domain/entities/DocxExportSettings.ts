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
		// ヘッダー・フッター用の余白
		header?: number
		footer?: number
		// 装丁用の余白（本の製本用）
		gutter?: number
		// 対向ページ用の余白
		mirror?: boolean
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

	// 縦書き用の追加設定
	verticalWritingOptions?: {
		// 文字の回転角度（縦書き用）
		textRotation?: number
		// 行の方向
		textDirection?: 'vertical' | 'horizontal'
		// ページの向き（縦書き用の横向き）
		pageOrientation?: 'landscape' | 'portrait'
	}

	// ページレイアウト設定
	pageLayout?: {
		// 段組み設定
		columns?: number
		// 段間隔
		columnGap?: number
		// ページ番号の位置
		pageNumberPosition?: 'top' | 'bottom' | 'none'
		// ヘッダー・フッターの表示
		showHeader?: boolean
		showFooter?: boolean
	}
}

export const DEFAULT_DOCX_SETTINGS: DocxExportSettings = {
	pageSize: 'A4',
	orientation: 'portrait', // A4縦向き
	margins: {
		top: 30, // 上余白30mm
		right: 25, // 右余白25mm
		bottom: 30, // 下余白30mm
		left: 25, // 左余白25mm
		header: 10, // ヘッダー余白10mm
		footer: 10, // フッター余白10mm
		gutter: 0, // 装丁余白0mm
		mirror: false, // 対向ページ余白なし
	},
	verticalWriting: false, // 横書き
	font: {
		family: 'Yu Mincho', // 明朝体
		size: 12, // 12pt
	},
	lineSpacing: 1.5, // 行間1.5倍
	pageLayout: {
		columns: 1, // 1段組み
		columnGap: 10, // 段間隔10mm
		pageNumberPosition: 'bottom', // ページ番号を下に配置
		showHeader: false, // ヘッダー非表示
		showFooter: true, // フッター表示
	},
}
