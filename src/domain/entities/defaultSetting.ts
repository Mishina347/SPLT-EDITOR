import { isMobileSize } from '@/utils'
import { EditorSettings, FONT_FAMILIES } from '../editor/EditorSetting'
import { LayoutConfig } from '../preview/pdf/TextContent'
import { EditorTheme } from '../theme/EditorTheme'

export type Settings = {
	editor: EditorSettings
	preview: LayoutConfig
	resizerRatio?: number // エディタとプレビューの比率（%）
}

export enum DISPLAY_MODE {
	BOTH = 'both',
	EDITOR = 'editor',
	PREVIEW = 'preview',
}

// デフォルトテーマの定義
export const DEFAULT_THEME: EditorTheme = {
	background: '#ffffff',
	foreground: '#000000',
	keyword: '#0000ff',
	string: '#008000',
	comment: '#808080',
}

// デスクトップ用のデフォルト設定
export const DESKTOP_SETTING: Settings = {
	editor: {
		fontSize: 16,
		wordWrapColumn: 60,
		backgroundColor: '#ffffff',
		textColor: '#000000',
		fontFamily:
			'"UD デジタル 教科書体 N-R", "Hiragino Sans", "Yu Gothic UI", "Meiryo UI", sans-serif',
		theme: DEFAULT_THEME,
		autoSave: {
			enabled: true,
			delay: 10, // 10分後に自動保存
		},
	},
	preview: {
		charsPerLine: 20,
		linesPerPage: 20,
		fontSize: 16,
		fontFamily: FONT_FAMILIES.NOTO_SERIF,
	},
	resizerRatio: 60,
}

// モバイル用のデフォルト設定
export const MOBILE_SETTING: Settings = {
	editor: {
		fontSize: 12,
		wordWrapColumn: 30,
		backgroundColor: '#ffffff',
		textColor: '#000000',
		fontFamily:
			'"UD デジタル 教科書体 N-R", "Hiragino Sans", "Yu Gothic UI", "Meiryo UI", sans-serif',
		theme: DEFAULT_THEME,
		autoSave: {
			enabled: true,
			delay: 1, // 1分後に自動保存
		},
	},
	preview: {
		charsPerLine: 26,
		linesPerPage: 14,
		fontSize: 14,
		fontFamily: FONT_FAMILIES.NOTO_SERIF,
	},
	resizerRatio: 70,
}

// デフォルト設定（デスクトップ用）
export const DEFAULT_SETTING: Settings = DESKTOP_SETTING

// モバイル用の設定値（色味は保持するため、レイアウト関連のみ）
export const MOBILE_LAYOUT_VALUES = {
	editor: {
		fontSize: 12,
		wordWrapColumn: 30,
	},
	preview: {
		charsPerLine: 26,
		linesPerPage: 14,
		fontSize: 14,
	},
} as const

// デスクトップ用の設定値（色味は保持するため、レイアウト関連のみ）
export const DESKTOP_LAYOUT_VALUES = {
	editor: {
		fontSize: 16,
		wordWrapColumn: 60,
	},
	preview: {
		charsPerLine: 30,
		linesPerPage: 30,
		fontSize: 16,
	},
} as const

// デバイスサイズに応じて設定を動的に取得する関数
export function getDefaultSettingForDevice(): Settings {
	// ブラウザ環境でのみ実行
	if (typeof window !== 'undefined') {
		return isMobileSize() ? MOBILE_SETTING : DESKTOP_SETTING
	}
	// Node.js環境ではデスクトップ設定を返す
	return DESKTOP_SETTING
}

// デフォルトのテキスト
export const DEFAULT_TEXT = `縦書きエディタへようこそ

このアプリケーションは、日本語の縦書きテキストを編集・プレビューできるツールです。

使い方：
1. 左側のエディタでテキストを入力
2. 右側のプレビューで縦書き表示を確認
3. ツールバーでフォントやレイアウトを調整
4. 設定は自動的に保存されます
`

export interface SettingsRepository {
	loadSettings(): Promise<Settings>
	saveSettings(settings: Settings): Promise<void>
}
