import { useCallback, useRef, useEffect, useMemo, useState } from 'react'
import { PerformanceMetric } from '@/types/common'

interface UsePerformanceOptimizationOptions {
	enableMetrics?: boolean
	debounceDelay?: number
	throttleDelay?: number
}

export const usePerformanceOptimization = (options: UsePerformanceOptimizationOptions = {}) => {
	const { enableMetrics = false, debounceDelay = 100, throttleDelay = 16 } = options

	const metricsRef = useRef<PerformanceMetric[]>([])
	const debounceTimersRef = useRef<Map<string, NodeJS.Timeout>>(new Map())
	const throttleTimersRef = useRef<Map<string, number>>(new Map())

	// パフォーマンス計測
	const measurePerformance = useCallback(
		(name: string, fn: () => void, metadata?: Record<string, unknown>) => {
			if (!enableMetrics) {
				fn()
				return
			}

			const startTime = performance.now()
			fn()
			const endTime = performance.now()
			const duration = endTime - startTime

			const metric: PerformanceMetric = {
				name,
				duration,
				timestamp: Date.now(),
				metadata,
			}

			metricsRef.current.push(metric)

			// 最大100件まで保持
			if (metricsRef.current.length > 100) {
				metricsRef.current = metricsRef.current.slice(-100)
			}
		},
		[enableMetrics]
	)

	// デバウンス
	const debounce = useCallback(
		<T extends (...args: any[]) => void>(key: string, fn: T, delay: number = debounceDelay): T => {
			return ((...args: Parameters<T>) => {
				const existingTimer = debounceTimersRef.current.get(key)
				if (existingTimer) {
					clearTimeout(existingTimer)
				}

				const timer = setTimeout(() => {
					fn(...args)
					debounceTimersRef.current.delete(key)
				}, delay)

				debounceTimersRef.current.set(key, timer)
			}) as T
		},
		[debounceDelay]
	)

	// スロットル
	const throttle = useCallback(
		<T extends (...args: any[]) => void>(key: string, fn: T, delay: number = throttleDelay): T => {
			return ((...args: Parameters<T>) => {
				const lastCall = throttleTimersRef.current.get(key) || 0
				const now = Date.now()

				if (now - lastCall >= delay) {
					fn(...args)
					throttleTimersRef.current.set(key, now)
				}
			}) as T
		},
		[throttleDelay]
	)

	// メモ化されたコールバック
	const memoizedCallback = useCallback(
		<T extends (...args: any[]) => void>(fn: T, deps: React.DependencyList): T => {
			return useCallback(fn, deps)
		},
		[]
	)

	// メトリクス取得
	const getMetrics = useCallback(() => {
		return [...metricsRef.current]
	}, [])

	// メトリクスクリア
	const clearMetrics = useCallback(() => {
		metricsRef.current = []
	}, [])

	// クリーンアップ
	useEffect(() => {
		return () => {
			// タイマーのクリーンアップ
			debounceTimersRef.current.forEach(timer => clearTimeout(timer))
			debounceTimersRef.current.clear()
			throttleTimersRef.current.clear()
		}
	}, [])

	return {
		measurePerformance,
		debounce,
		throttle,
		memoizedCallback,
		getMetrics,
		clearMetrics,
	}
}

// 仮想化用フック
export const useVirtualization = <T>(
	items: T[],
	itemHeight: number,
	containerHeight: number,
	overscan: number = 5
) => {
	const [scrollTop, setScrollTop] = useState(0)

	const visibleRange = useMemo(() => {
		const startIndex = Math.max(0, Math.floor(scrollTop / itemHeight) - overscan)
		const endIndex = Math.min(
			items.length - 1,
			Math.ceil((scrollTop + containerHeight) / itemHeight) + overscan
		)

		return { startIndex, endIndex }
	}, [scrollTop, itemHeight, containerHeight, overscan, items.length])

	const visibleItems = useMemo(() => {
		return items.slice(visibleRange.startIndex, visibleRange.endIndex + 1)
	}, [items, visibleRange])

	const totalHeight = items.length * itemHeight
	const offsetY = visibleRange.startIndex * itemHeight

	const handleScroll = useCallback((event: React.UIEvent<HTMLDivElement>) => {
		setScrollTop(event.currentTarget.scrollTop)
	}, [])

	return {
		visibleItems,
		totalHeight,
		offsetY,
		handleScroll,
		visibleRange,
	}
}

// リサイズ監視フック
export const useResizeObserver = (
	ref: React.RefObject<HTMLElement>,
	callback: (entry: ResizeObserverEntry) => void,
	options?: ResizeObserverOptions
) => {
	const observerRef = useRef<ResizeObserver | null>(null)

	useEffect(() => {
		if (!ref.current) return

		observerRef.current = new ResizeObserver(entries => {
			entries.forEach(callback)
		})

		observerRef.current.observe(ref.current, options)

		return () => {
			if (observerRef.current) {
				observerRef.current.disconnect()
			}
		}
	}, [ref, callback, options])

	return observerRef.current
}
