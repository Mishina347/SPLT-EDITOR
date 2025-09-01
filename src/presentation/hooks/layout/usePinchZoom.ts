import { useRef, useCallback, useState } from 'react'

export interface PinchZoomState {
	scale: number
	isPinching: boolean
}

interface UsePinchZoomOptions {
	initialScale?: number
	minScale?: number
	maxScale?: number
	onScaleChange?: (scale: number) => void
	onPinchStart?: () => void
	onPinchEnd?: () => void
}

export const usePinchZoom = (options: UsePinchZoomOptions = {}) => {
	const {
		initialScale = 1,
		minScale = 0.5,
		maxScale = 3,
		onScaleChange,
		onPinchStart,
		onPinchEnd,
	} = options

	const [state, setState] = useState<PinchZoomState>({
		scale: initialScale,
		isPinching: false,
	})

	const lastTouchDistance = useRef<number>(0)
	const startScale = useRef<number>(1)

	// 2点間の距離を計算
	const getTouchDistance = useCallback((touch1: React.Touch, touch2: React.Touch): number => {
		const dx = touch1.clientX - touch2.clientX
		const dy = touch1.clientY - touch2.clientY
		return Math.sqrt(dx * dx + dy * dy)
	}, [])

	// ピンチ開始
	const handleTouchStart = useCallback(
		(e: React.TouchEvent) => {
			if (e.touches.length === 2) {
				// preventDefault は呼び出し元で実行済み
				const distance = getTouchDistance(e.touches[0], e.touches[1])
				lastTouchDistance.current = distance
				startScale.current = state.scale
				setState(prev => ({ ...prev, isPinching: true }))
				onPinchStart?.()
			}
		},
		[state.scale, getTouchDistance, onPinchStart]
	)

	// ピンチ移動
	const handleTouchMove = useCallback(
		(e: React.TouchEvent) => {
			if (e.touches.length === 2 && state.isPinching) {
				// preventDefault は呼び出し元で実行済み
				const distance = getTouchDistance(e.touches[0], e.touches[1])
				const scale = (distance / lastTouchDistance.current) * startScale.current

				// スケールを制限
				const newScale = Math.max(minScale, Math.min(maxScale, scale))

				setState(prev => ({ ...prev, scale: newScale }))
				onScaleChange?.(newScale)
			}
		},
		[state.isPinching, getTouchDistance, minScale, maxScale, onScaleChange]
	)

	// ピンチ終了
	const handleTouchEnd = useCallback(
		(e: React.TouchEvent) => {
			if (e.touches.length < 2 && state.isPinching) {
				setState(prev => ({ ...prev, isPinching: false }))
				onPinchEnd?.()
			}
		},
		[state.isPinching, onPinchEnd]
	)

	// スケールをリセット
	const resetScale = useCallback(() => {
		setState(prev => ({ ...prev, scale: initialScale }))
		onScaleChange?.(initialScale)
	}, [initialScale, onScaleChange])

	// スケールを設定
	const setScale = useCallback(
		(newScale: number) => {
			const clampedScale = Math.max(minScale, Math.min(maxScale, newScale))
			setState(prev => ({ ...prev, scale: clampedScale }))
			onScaleChange?.(clampedScale)
		},
		[minScale, maxScale, onScaleChange]
	)

	return {
		state,
		handlers: {
			onTouchStart: handleTouchStart,
			onTouchMove: handleTouchMove,
			onTouchEnd: handleTouchEnd,
		},
		resetScale,
		setScale,
	}
}
