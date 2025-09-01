import { useState, useEffect, useCallback, RefObject } from 'react'

interface UsePreviewFocusModeProps {
	previewRef: RefObject<HTMLDivElement>
	onFocusMode: (focused: boolean) => void
}

export const usePreviewFocusMode = ({ previewRef, onFocusMode }: UsePreviewFocusModeProps) => {
	const [isFocusMode, setIsFocusMode] = useState(false)

	// グローバルクリックイベントでフォーカスモード解除
	useEffect(() => {
		const handleGlobalClick = (event: MouseEvent) => {
			if (!isFocusMode) return

			// プレビューエリア外をクリックした場合のみフォーカスモード解除
			if (previewRef.current && !previewRef.current.contains(event.target as Node)) {
				setIsFocusMode(false)
				onFocusMode?.(false)
			}
		}

		if (isFocusMode) {
			document.addEventListener('click', handleGlobalClick, true)
		}

		return () => {
			document.removeEventListener('click', handleGlobalClick, true)
		}
	}, [isFocusMode, onFocusMode, previewRef])

	const handlePageBaseClick = useCallback(
		(e: React.MouseEvent) => {
			if (isFocusMode) return
			const newFocusMode = !isFocusMode
			setIsFocusMode(newFocusMode)
			onFocusMode?.(newFocusMode)
		},
		[isFocusMode, onFocusMode]
	)

	const handleFocusModeChange = useCallback(
		(focused: boolean) => {
			setIsFocusMode(focused)
			onFocusMode?.(focused)
		},
		[onFocusMode]
	)

	return {
		isFocusMode,
		handlePageBaseClick,
		handleFocusModeChange,
		setIsFocusMode,
	}
}
