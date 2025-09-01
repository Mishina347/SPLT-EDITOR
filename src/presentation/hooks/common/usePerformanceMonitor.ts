import { useEffect, useRef } from 'react'

interface PerformanceMetrics {
	renderTime: number
	memoryUsage?: number
	timestamp: number
}

export function usePerformanceMonitor(componentName: string) {
	const renderCountRef = useRef(0)
	const lastRenderTimeRef = useRef<number>(0)

	useEffect(() => {
		const startTime = performance.now()
		renderCountRef.current++

		return () => {
			const endTime = performance.now()
			const renderTime = endTime - startTime
			lastRenderTimeRef.current = renderTime

			// パフォーマンス警告の閾値
			const WARNING_THRESHOLD = 16 // 16ms (60fps)
			const CRITICAL_THRESHOLD = 33 // 33ms (30fps)

			if (renderTime > CRITICAL_THRESHOLD) {
				console.warn(
					`[Performance] ${componentName}: Critical render time: ${renderTime.toFixed(2)}ms (render #${renderCountRef.current})`
				)
			} else if (renderTime > WARNING_THRESHOLD) {
				console.warn(
					`[Performance] ${componentName}: Slow render time: ${renderTime.toFixed(2)}ms (render #${renderCountRef.current})`
				)
			}

			// メモリ使用量の監視（開発環境のみ）
			if (process.env.NODE_ENV === 'development') {
				const memoryInfo = (performance as any).memory
				if (memoryInfo) {
					const usedMB = memoryInfo.usedJSHeapSize / 1024 / 1024
					const totalMB = memoryInfo.totalJSHeapSize / 1024 / 1024

					if (usedMB > 100) {
						// 100MB以上使用時
						console.warn(
							`[Memory] ${componentName}: High memory usage: ${usedMB.toFixed(2)}MB / ${totalMB.toFixed(2)}MB`
						)
					}
				}
			}
		}
	})

	// パフォーマンスメトリクスを取得
	const getMetrics = (): PerformanceMetrics => {
		const metrics: PerformanceMetrics = {
			renderTime: lastRenderTimeRef.current,
			timestamp: Date.now(),
		}

		// メモリ使用量（利用可能な場合）
		if (process.env.NODE_ENV === 'development') {
			const memoryInfo = (performance as any).memory
			if (memoryInfo) {
				metrics.memoryUsage = memoryInfo.usedJSHeapSize / 1024 / 1024
			}
		}

		return metrics
	}

	return {
		renderCount: renderCountRef.current,
		lastRenderTime: lastRenderTimeRef.current,
		getMetrics,
	}
}
