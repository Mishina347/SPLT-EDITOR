import { useCallback } from 'react'
import { usePWA } from '../../hooks/pwa/usePWA'
import { useAutoSave } from '../../hooks/editor/useAutoSave'
import { logger } from '@/utils/logger'

interface EditorSettingsLike {
	autoSave: {
		enabled: boolean
		delay: number
	}
}

interface UseEditorInputSaveParams {
	editorSettings: EditorSettingsLike
	currentNotSavedText: string
	updateText: (text: string) => void
	setLastSavedText: (text: string) => void
	setCurrentSavedText: (text: string) => void
}

export const useEditorInputSave = ({
	editorSettings,
	currentNotSavedText,
	updateText,
	setLastSavedText,
	setCurrentSavedText,
}: UseEditorInputSaveParams) => {
	const { isInstalled: isPwaInstalled } = usePWA()

	const handleAutoSave = useCallback(
		(content: string) => {
			setLastSavedText(content)
			setCurrentSavedText(content)
		},
		[setLastSavedText, setCurrentSavedText]
	)

	const { forceSave, isSaving } = useAutoSave(currentNotSavedText, {
		enabled: editorSettings.autoSave.enabled,
		delay: editorSettings.autoSave.delay,
		fileName: 'document.json',
		onSave: handleAutoSave,
	})

	const onChangeText = useCallback(
		(v: string) => {
			updateText(v)
			if (isPwaInstalled) {
				;(async () => {
					try {
						setCurrentSavedText(v)
					} catch (e) {
						logger.error('useEditorInputSave', 'Immediate save (PWA) failed', e)
					}
				})()
			}
		},
		[updateText, isPwaInstalled, setLastSavedText, setCurrentSavedText]
	)

	return { onChangeText, isPwaInstalled, isSaving, forceSave }
}
