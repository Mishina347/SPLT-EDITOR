import { useState, useCallback, useEffect, useRef } from 'react'

interface UsePreviewInteractionProps {
	onFocusMode?: (isFocused: boolean) => void
}

export const usePreviewInteraction = ({ onFocusMode }: UsePreviewInteractionProps) => {
	const [mousePosition, setMousePosition] = useState<'left' | 'right' | null>(null)
	const [isFocusMode, setIsFocusMode] = useState(false)
	const previewRef = useRef<HTMLDivElement>(null)

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
	}, [isFocusMode, onFocusMode])

	// マウス位置の管理
	const handleMouseMove = useCallback((e: React.MouseEvent, containerRect: DOMRect) => {
		const mouseX = e.clientX - containerRect.left
		const middle = containerRect.width / 2

		if (mouseX < middle) {
			setMousePosition('left')
		} else {
			setMousePosition('right')
		}
	}, [])

	const handleMouseLeave = useCallback(() => {
		setMousePosition(null)
	}, [])

	// ページベースクリックでフォーカスモード切り替え
	const handlePageBaseClick = useCallback(
		(e: React.MouseEvent) => {
			if (isFocusMode) return
			const newFocusMode = !isFocusMode
			setIsFocusMode(newFocusMode)
			onFocusMode?.(newFocusMode)
		},
		[isFocusMode, onFocusMode]
	)

	return {
		// 状態
		mousePosition,
		isFocusMode,
		previewRef,

		// アクション
		handleMouseMove,
		handleMouseLeave,
		handlePageBaseClick,
		setIsFocusMode,
	}
}
