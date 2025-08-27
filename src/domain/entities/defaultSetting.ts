import { isMobileSize } from '@/utils'
import { EditorSettings, FONT_FAMILIES } from '../editor/EditorSetting'
import { LayoutConfig } from '../preview/pdf/TextContent'

export type Settings = {
	editor: EditorSettings
	preview: LayoutConfig
}

export enum DISPLAY_MODE {
	BOTH = 'both',
	EDITOR = 'editor',
	PREVIEW = 'preview',
}

export const DEFAULT_SETTING: Settings = !isMobileSize()
	? {
			editor: {
				fontSize: 16,
				wordWrapColumn: 60,
				backgroundColor: '#ffffff',
				textColor: '#000000',
				fontFamily:
					'"UD デジタル 教科書体 N-R", "Hiragino Sans", "Yu Gothic UI", "Meiryo UI", sans-serif',
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
	: {
			editor: {
				fontSize: 12,
				wordWrapColumn: 30,
				backgroundColor: '#ffffff',
				textColor: '#000000',
				fontFamily:
					'"UD デジタル 教科書体 N-R", "Hiragino Sans", "Yu Gothic UI", "Meiryo UI", sans-serif',
				autoSave: {
					enabled: true,
					delay: 1, // 10分後に自動保存
				},
			},
			preview: {
				charsPerLine: 30,
				linesPerPage: 16,
				fontSize: 14,
				fontFamily: FONT_FAMILIES.NOTO_SERIF,
			},
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
