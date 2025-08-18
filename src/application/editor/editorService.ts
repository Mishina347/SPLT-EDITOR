import { EditorUIState } from '../../domain/editor/EditorState'

export const editorService = {
	toggleToolbar(state: EditorUIState): EditorUIState {
		return { ...state, showToolbar: !state.showToolbar }
	},
	togglePreview(state: EditorUIState): EditorUIState {
		return { ...state, showPreview: !state.showPreview }
	},
}
