import { useState, useCallback, useEffect } from 'react'
import { PREVIEW_CONSTANTS } from '../../domain'

interface UsePreviewSwipeProps {
	notInitPage: boolean
	notLastPage: boolean
	onPrev: () => void
	onNext: () => void
}

export const usePreviewSwipe = ({
	notInitPage,
	notLastPage,
	onPrev,
	onNext,
}: UsePreviewSwipeProps) => {
	// スワイプ検出用の状態
	const [touchStart, setTouchStart] = useState<{ x: number; y: number } | null>(null)
	const [touchEnd, setTouchEnd] = useState<{ x: number; y: number } | null>(null)
	const [isSwipping, setIsSwipping] = useState(false)

	// スワイプ検出の閾値
	const SWIPE_THRESHOLD = PREVIEW_CONSTANTS.SWIPE.THRESHOLD
	const VERTICAL_THRESHOLD = PREVIEW_CONSTANTS.SWIPE.VERTICAL_THRESHOLD

	// スワイプ処理
	const handleSwipe = useCallback(() => {
		if (!touchStart || !touchEnd) return

		const deltaX = touchEnd.x - touchStart.x
		const deltaY = Math.abs(touchEnd.y - touchStart.y)

		// 縦方向の移動が大きすぎる場合はスワイプとして認識しない
		if (deltaY > VERTICAL_THRESHOLD) return

		// 水平方向のスワイプを検出
		if (Math.abs(deltaX) > SWIPE_THRESHOLD) {
			if (deltaX > 0) {
				// 右スワイプ → 前のページ（日本語縦書きの場合）
				if (notInitPage) onPrev()
			} else {
				// 左スワイプ → 次のページ（日本語縦書きの場合）
				if (notLastPage) onNext()
			}
		}

		// リセット
		setTouchStart(null)
		setTouchEnd(null)
	}, [
		touchStart,
		touchEnd,
		notInitPage,
		notLastPage,
		onPrev,
		onNext,
		SWIPE_THRESHOLD,
		VERTICAL_THRESHOLD,
	])

	// スワイプ検出のuseEffect
	useEffect(() => {
		if (touchEnd !== null) {
			handleSwipe()
		}
	}, [touchEnd, handleSwipe])

	// タッチイベントハンドラー
	const handleTouchStart = useCallback((e: React.TouchEvent) => {
		const touch = e.touches[0]
		setTouchStart({ x: touch.clientX, y: touch.clientY })
		setTouchEnd(null)
		setIsSwipping(true)
	}, [])

	const handleTouchMove = useCallback(
		(e: React.TouchEvent) => {
			if (!touchStart) return
			const touch = e.touches[0]
			setTouchEnd({ x: touch.clientX, y: touch.clientY })
		},
		[touchStart]
	)

	const handleTouchEnd = useCallback(() => {
		setIsSwipping(false)
		// touchEndの状態は既にhandleTouchMoveで設定されているので、
		// ここでは何もしない（useEffectでhandleSwipeが呼ばれる）
	}, [])

	return {
		isSwipping,
		handleTouchStart,
		handleTouchMove,
		handleTouchEnd,
	}
}
