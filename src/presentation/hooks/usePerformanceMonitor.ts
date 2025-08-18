import { useEffect, useRef, useCallback } from 'react'

interface PerformanceMetrics {
	renderTime: number
	memoryUsage?: number
	componentRenderCount: number
	lastRenderTimestamp: number
}

interface UsePerformanceMonitorOptions {
	enableMemoryMonitoring?: boolean
	logThreshold?: number
	componentName?: string
}

/**
 * パフォーマンス監視フック
 */
export function usePerformanceMonitor(options: UsePerformanceMonitorOptions = {}) {
	const {
		enableMemoryMonitoring = false,
		logThreshold = 16, // 16ms (60fps threshold)
		componentName = 'Component',
	} = options

	const metricsRef = useRef<PerformanceMetrics>({
		renderTime: 0,
		componentRenderCount: 0,
		lastRenderTimestamp: 0,
	})

	const renderStartRef = useRef<number>(0)

	// レンダリング開始時刻を記録
	const markRenderStart = useCallback(() => {
		renderStartRef.current = performance.now()
	}, [])

	// レンダリング終了時刻を記録
	const markRenderEnd = useCallback(() => {
		const renderTime = performance.now() - renderStartRef.current
		const now = Date.now()

		metricsRef.current = {
			renderTime,
			componentRenderCount: metricsRef.current.componentRenderCount + 1,
			lastRenderTimestamp: now,
			memoryUsage: enableMemoryMonitoring ? getMemoryUsage() : undefined,
		}

		// しきい値を超えた場合は警告ログ
		if (renderTime > logThreshold) {
			console.warn(
				`[Performance] ${componentName} render took ${renderTime.toFixed(2)}ms (threshold: ${logThreshold}ms)`
			)
		}

		// デバッグ情報（開発環境のみ）
		if (process.env.NODE_ENV === 'development') {
			console.debug(`[Performance] ${componentName}:`, {
				renderTime: `${renderTime.toFixed(2)}ms`,
				renderCount: metricsRef.current.componentRenderCount,
				memoryUsage: metricsRef.current.memoryUsage
					? `${metricsRef.current.memoryUsage.toFixed(2)}MB`
					: 'N/A',
			})
		}
	}, [enableMemoryMonitoring, logThreshold, componentName])

	// パフォーマンス測定の実行
	const measurePerformance = useCallback(
		<T extends unknown[]>(fn: (...args: T) => void, label: string = 'Function') => {
			return (...args: T) => {
				const start = performance.now()
				const result = fn(...args)
				const end = performance.now()

				const executionTime = end - start

				if (executionTime > logThreshold) {
					console.warn(`[Performance] ${componentName}.${label} took ${executionTime.toFixed(2)}ms`)
				}

				return result
			}
		},
		[logThreshold, componentName]
	)

	// 非同期関数のパフォーマンス測定
	const measureAsyncPerformance = useCallback(
		<T extends unknown[], R>(fn: (...args: T) => Promise<R>, label: string = 'AsyncFunction') => {
			return async (...args: T): Promise<R> => {
				const start = performance.now()
				const result = await fn(...args)
				const end = performance.now()

				const executionTime = end - start

				if (executionTime > logThreshold) {
					console.warn(`[Performance] ${componentName}.${label} took ${executionTime.toFixed(2)}ms`)
				}

				return result
			}
		},
		[logThreshold, componentName]
	)

	// メトリクス取得
	const getMetrics = useCallback((): PerformanceMetrics => {
		return { ...metricsRef.current }
	}, [])

	// パフォーマンス要約の取得
	const getPerformanceSummary = useCallback(() => {
		const metrics = metricsRef.current
		const averageRenderTime = metrics.renderTime // 最新のレンダリング時間

		return {
			componentName,
			renderCount: metrics.componentRenderCount,
			lastRenderTime: metrics.renderTime,
			averageRenderTime,
			memoryUsage: metrics.memoryUsage,
			isPerformant: metrics.renderTime <= logThreshold,
			lastRenderTimestamp: metrics.lastRenderTimestamp,
		}
	}, [componentName, logThreshold])

	// コンポーネントのレンダリング時にメトリクスを更新
	useEffect(() => {
		markRenderStart()
		// レンダリング後にメトリクスを更新
		const timeoutId = setTimeout(markRenderEnd, 0)
		return () => clearTimeout(timeoutId)
	})

	// メモリリーク検出（開発環境のみ）
	useEffect(() => {
		if (process.env.NODE_ENV !== 'development' || !enableMemoryMonitoring) {
			return
		}

		const interval = setInterval(() => {
			const memoryUsage = getMemoryUsage()
			if (memoryUsage && memoryUsage > 100) {
				// 100MB threshold
				console.warn(`[Performance] ${componentName} high memory usage: ${memoryUsage.toFixed(2)}MB`)
			}
		}, 10000) // 10秒間隔

		return () => clearInterval(interval)
	}, [enableMemoryMonitoring, componentName])

	return {
		markRenderStart,
		markRenderEnd,
		measurePerformance,
		measureAsyncPerformance,
		getMetrics,
		getPerformanceSummary,
	}
}

/**
 * メモリ使用量を取得（ブラウザサポートがある場合）
 */
function getMemoryUsage(): number | undefined {
	if ('memory' in performance) {
		const memInfo = (performance as any).memory
		if (memInfo && typeof memInfo.usedJSHeapSize === 'number') {
			return memInfo.usedJSHeapSize / 1024 / 1024 // MB単位
		}
	}
	return undefined
}

/**
 * レンダリングパフォーマンスの自動監視フック
 */
export function useRenderPerformanceMonitor(componentName: string) {
	const { markRenderStart, markRenderEnd, getPerformanceSummary } = usePerformanceMonitor({
		componentName,
		enableMemoryMonitoring: true,
		logThreshold: 16, // 60fps threshold
	})

	// レンダリング前後を自動的に監視
	useEffect(() => {
		markRenderStart()
		return markRenderEnd
	})

	return { getPerformanceSummary }
}
