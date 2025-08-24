import { useState, useCallback, useMemo, useEffect } from 'react'
import { calculateCharCount } from '../../domain/text/calculateCharCount'
import { DEFAULT_TEXT } from '../../domain/entities/defaultSetting'

export function useCharCount() {
	const [currentNotSavedText, setCurrentNotSavedText] = useState(DEFAULT_TEXT)

	// 初期化時にデフォルトテキストを確実に設定
	useEffect(() => {
		if (!currentNotSavedText) {
			setCurrentNotSavedText(DEFAULT_TEXT)
		}
	}, [currentNotSavedText])

	const charCount = useMemo(() => {
		return calculateCharCount(currentNotSavedText).characterCount
	}, [currentNotSavedText])

	const updateText = useCallback((newText: string) => {
		setCurrentNotSavedText(newText)
	}, [])

	return { currentNotSavedText, charCount, updateText }
}
