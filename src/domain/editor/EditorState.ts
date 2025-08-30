import { Settings } from '../entities/defaultSetting'
import { EditorSettings, FONT_FAMILIES } from './EditorSetting'
import { DEFAULT_THEME } from '../entities/defaultSetting'

export function defaultEditorSettings(): EditorSettings {
	return {
		fontSize: 16,
		wordWrapColumn: 60,
		backgroundColor: '#ffffff',
		textColor: '#000000',
		fontFamily: FONT_FAMILIES.UD_DIGITAL,
		theme: DEFAULT_THEME,
		autoSave: {
			enabled: true,
			delay: 1000,
		},
	}
}

export interface EditorUIState {
	showToolbar: boolean
	showPreview: boolean
}
