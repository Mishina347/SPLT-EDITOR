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

export const DEFAULT_SETTING: Settings = {
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
		fontFamily: FONT_FAMILIES.UD_DIGITAL,
	},
}

export interface SettingsRepository {
	loadSettings(): Promise<Settings>
	saveSettings(settings: Settings): Promise<void>
}
