import { isMobileSize } from '../../utils'
import { EditorSettings, FONT_FAMILIES } from '../editor/EditorSetting'
import { LayoutConfig } from '../preview/pdf/TextContent'
import { EditorTheme } from '../theme/EditorTheme'

export type Settings = {
	editor: EditorSettings
	preview: LayoutConfig
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
}

// デフォルト設定（デスクトップ用）
export const DEFAULT_SETTING: Settings = DESKTOP_SETTING

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

主な機能：
• 縦書きテキストの編集
• リアルタイムプレビュー
• フォント設定のカスタマイズ
• 自動保存機能
• レスポンシブデザイン

使い方：
1. 左側のエディタでテキストを入力
2. 右側のプレビューで縦書き表示を確認
3. ツールバーでフォントやレイアウトを調整
4. 設定は自動的に保存されます

縦書きの特徴：
• 右から左へ文字が並びます
• 改行は上から下へ進みます
• 日本語の禁則処理に対応
• ページネーション機能付き

お楽しみください！`

export interface SettingsRepository {
	loadSettings(): Promise<Settings>
	saveSettings(settings: Settings): Promise<void>
}
