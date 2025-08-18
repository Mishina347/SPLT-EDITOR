import { Settings } from '../entities/defaultSetting'
import { EditorSettings, FONT_FAMILIES } from './EditorSetting'

export function defaultEditorSettings(): EditorSettings {
	return {
		fontSize: 16,
		wordWrapColumn: 60,
		backgroundColor: '#ffffff',
		textColor: '#000000',
		fontFamily: FONT_FAMILIES.UD_DIGITAL,
	}
}

export interface EditorUIState {
	showToolbar: boolean
	showPreview: boolean
}
