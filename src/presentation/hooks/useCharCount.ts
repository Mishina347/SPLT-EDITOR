import { useState, useCallback, useMemo, useEffect } from 'react'
import { calculateCharCount } from '../../domain/text/calculateCharCount'

export function useCharCount() {
	const [currentNotSavedText, setCurrentNotSavedText] = useState('')
	const charCount = useMemo(() => {
		return calculateCharCount(currentNotSavedText)
	}, [currentNotSavedText])

	const updateText = useCallback((newText: string) => {
		setCurrentNotSavedText(newText)
	}, [])

	return { currentNotSavedText, charCount, updateText }
}
