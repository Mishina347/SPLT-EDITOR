import { EditorSettings } from '../editor/EditorSetting'
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
	},
	preview: {
		charsPerLine: 20,
		linesPerPage: 20,
	},
}

export interface SettingsRepository {
	loadSettings(): Promise<Settings>
	saveSettings(settings: Settings): Promise<void>
}
