import { useState, useCallback, RefObject } from 'react'

interface UsePreviewMouseProps {
	containerRef: RefObject<HTMLDivElement>
	notInitPage: boolean
	notLastPage: boolean
	onPrev: () => void
	onNext: () => void
}

export const usePreviewMouse = ({
	containerRef,
	notInitPage,
	notLastPage,
	onPrev,
	onNext,
}: UsePreviewMouseProps) => {
	const [mousePosition, setMousePosition] = useState<'left' | 'right' | null>(null)

	const handleMouseMove = useCallback(
		(e: React.MouseEvent) => {
			const rect = containerRef.current?.getBoundingClientRect()
			if (!rect) return
			const mouseX = e.clientX - rect.left
			const middle = rect.width / 2

			if (mouseX < middle) {
				setMousePosition('left')
			} else {
				setMousePosition('right')
			}
		},
		[containerRef]
	)

	const handleMouseLeave = useCallback(() => {
		setMousePosition(null)
	}, [])

	const handleClick = useCallback(
		(e: React.MouseEvent) => {
			e.stopPropagation()
			const rect = containerRef.current?.getBoundingClientRect()
			if (!rect) return
			const clickX = e.clientX - rect.left
			// container 内の X 座標
			const middle = rect.width / 2
			if (clickX < middle) {
				if (notLastPage) onNext()
				// 左側クリック → 1ページ進む
			} else {
				if (notInitPage) onPrev()
				// 右側クリック → 1ページ戻る
			}
		},
		[containerRef, onNext, onPrev, notInitPage, notLastPage]
	)

	return {
		mousePosition,
		handleMouseMove,
		handleMouseLeave,
		handleClick,
	}
}
