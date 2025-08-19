import { useState, useCallback, useMemo } from 'react'
import { calculateCharCount } from '../../domain/text/calculateCharCount'

export function useCharCount() {
	const [currentNotSavedText, setCurrentNotSavedText] = useState('')
	const charCount = useMemo(() => {
		return calculateCharCount(currentNotSavedText).characterCount
	}, [currentNotSavedText])

	const updateText = useCallback((newText: string) => {
		setCurrentNotSavedText(newText)
	}, [])

	return { currentNotSavedText, charCount, updateText }
}
