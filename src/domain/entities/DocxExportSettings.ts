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
	orientation: 'landscape', // A4横向き
	margins: {
		top: 50, // 上余白を50mmに増加（Pages対応）
		right: 30, // 右余白30mm（Pages対応）
		bottom: 50, // 下余白を50mmに増加（Pages対応）
		left: 30, // 左余白30mm（Pages対応）
		header: 20, // ヘッダー余白20mm（Pages対応）
		footer: 20, // フッター余白20mm（Pages対応）
		gutter: 0, // 装丁余白0mm
		mirror: false, // 対向ページ余白なし
	},
	verticalWriting: true, // 縦書き有効
	font: {
		family: 'Yu Mincho', // Pages対応の明朝体
		size: 16,
	},
	lineSpacing: 1.8, // 縦書き用に行間を調整
	verticalWritingOptions: {
		textRotation: 90, // 文字を90度回転（縦書き用）
		textDirection: 'vertical', // 縦方向のテキスト
		pageOrientation: 'landscape', // 縦書き用の横向きページ
	},
	pageLayout: {
		columns: 1, // 1段組み
		columnGap: 10, // 段間隔10mm
		pageNumberPosition: 'bottom', // ページ番号を下に配置
		showHeader: false, // ヘッダー非表示
		showFooter: true, // フッター表示
	},
}
