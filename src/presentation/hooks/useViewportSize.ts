import { useState, useEffect } from 'react'

interface ViewportSize {
	width: number
	height: number
}

export const useViewportSize = (): ViewportSize => {
	const [viewportSize, setViewportSize] = useState<ViewportSize>(() => {
		// SSR対応: windowが利用可能かチェック
		if (typeof window !== 'undefined') {
			return {
				width: window.innerWidth,
				height: window.innerHeight,
			}
		}
		return {
			width: 1024, // デフォルト値
			height: 768,
		}
	})

	useEffect(() => {
		// SSR環境では何もしない
		if (typeof window === 'undefined') return

		const handleResize = () => {
			setViewportSize({
				width: window.innerWidth,
				height: window.innerHeight,
			})
		}

		// ResizeObserverが利用可能な場合は使用（より正確）
		if (typeof ResizeObserver !== 'undefined') {
			const resizeObserver = new ResizeObserver(() => {
				handleResize()
			})

			resizeObserver.observe(document.documentElement)

			return () => {
				resizeObserver.disconnect()
			}
		} else {
			// フォールバック: resize イベント
			window.addEventListener('resize', handleResize, { passive: true })

			return () => {
				window.removeEventListener('resize', handleResize)
			}
		}
	}, [])

	return viewportSize
}
