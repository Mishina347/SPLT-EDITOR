import { useEffect, useRef, useState } from 'react'

export interface SwipeDirection {
	up: boolean
	down: boolean
	left: boolean
	right: boolean
}

export interface SwipeGestureOptions {
	threshold?: number // スワイプを検出する最小距離
	velocityThreshold?: number // スワイプを検出する最小速度
	onSwipe?: (direction: SwipeDirection, event: TouchEvent) => void
}

export const useSwipeGesture = (options: SwipeGestureOptions = {}) => {
	const { threshold = 50, velocityThreshold = 0.3, onSwipe } = options

	const touchStartRef = useRef<{ x: number; y: number; time: number } | null>(null)
	const [isDetecting, setIsDetecting] = useState(false)

	useEffect(() => {
		const handleTouchStart = (event: TouchEvent) => {
			const touch = event.touches[0]
			touchStartRef.current = {
				x: touch.clientX,
				y: touch.clientY,
				time: Date.now(),
			}
			setIsDetecting(true)
		}

		const handleTouchEnd = (event: TouchEvent) => {
			if (!touchStartRef.current) return

			const touch = event.changedTouches[0]
			const startTouch = touchStartRef.current

			const deltaX = touch.clientX - startTouch.x
			const deltaY = touch.clientY - startTouch.y
			const deltaTime = Date.now() - startTouch.time

			const distanceX = Math.abs(deltaX)
			const distanceY = Math.abs(deltaY)
			const velocity = Math.max(distanceX, distanceY) / deltaTime

			// スワイプが閾値を超えているかチェック
			if ((distanceX > threshold || distanceY > threshold) && velocity > velocityThreshold) {
				const direction: SwipeDirection = {
					up: deltaY < -threshold,
					down: deltaY > threshold,
					left: deltaX < -threshold,
					right: deltaX > threshold,
				}

				onSwipe?.(direction, event)
			}

			touchStartRef.current = null
			setIsDetecting(false)
		}

		const handleTouchCancel = () => {
			touchStartRef.current = null
			setIsDetecting(false)
		}

		// パッシブリスナーを使用してスクロールのパフォーマンスを向上
		document.addEventListener('touchstart', handleTouchStart, { passive: true })
		document.addEventListener('touchend', handleTouchEnd, { passive: true })
		document.addEventListener('touchcancel', handleTouchCancel, { passive: true })

		return () => {
			document.removeEventListener('touchstart', handleTouchStart)
			document.removeEventListener('touchend', handleTouchEnd)
			document.removeEventListener('touchcancel', handleTouchCancel)
		}
	}, [threshold, velocityThreshold, onSwipe])

	return { isDetecting }
}
