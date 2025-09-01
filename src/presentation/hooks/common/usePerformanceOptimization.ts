import { useCallback, useRef, useEffect, useMemo, useState } from 'react'
import { logger } from '@/utils/logger'

// パフォーマンス測定
export const usePerformanceOptimization = () => {
	const performanceMetrics = useRef<Map<string, number[]>>(new Map())

	const measurePerformance = useCallback((name: string, fn: () => void) => {
		const start = performance.now()
		fn()
		const end = performance.now()
		const duration = end - start

		if (!performanceMetrics.current.has(name)) {
			performanceMetrics.current.set(name, [])
		}
		performanceMetrics.current.get(name)!.push(duration)

		logger.debug('Performance', `${name} took ${duration.toFixed(2)}ms`)
		return duration
	}, [])

	const getPerformanceStats = useCallback((name: string) => {
		const metrics = performanceMetrics.current.get(name) || []
		if (metrics.length === 0) return null

		const avg = metrics.reduce((a, b) => a + b, 0) / metrics.length
		const min = Math.min(...metrics)
		const max = Math.max(...metrics)

		return { avg, min, max, count: metrics.length }
	}, [])

	// デバウンス関数
	const debounce = useCallback(<T extends (...args: any[]) => any>(func: T, delay: number): T => {
		let timeoutId: NodeJS.Timeout

		return ((...args: Parameters<T>) => {
			clearTimeout(timeoutId)
			timeoutId = setTimeout(() => func(...args), delay)
		}) as T
	}, [])

	// スロットル関数
	const throttle = useCallback(<T extends (...args: any[]) => any>(func: T, delay: number): T => {
		let lastCall = 0

		return ((...args: Parameters<T>) => {
			const now = Date.now()
			if (now - lastCall >= delay) {
				lastCall = now
				func(...args)
			}
		}) as T
	}, [])

	// メモ化されたコールバック
	const memoizedCallback = useCallback(
		<T extends (...args: any[]) => any>(callback: T, dependencies: React.DependencyList): T => {
			return useCallback(callback, dependencies)
		},
		[]
	)

	return {
		measurePerformance,
		getPerformanceStats,
		debounce,
		throttle,
		memoizedCallback,
	}
}

// 仮想化フック
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
		visibleRange,
		totalHeight,
		offsetY,
		handleScroll,
	}
}

// ResizeObserverフック
export const useResizeObserver = (
	callback: (entry: ResizeObserverEntry) => void,
	options?: ResizeObserverOptions
) => {
	const observerRef = useRef<ResizeObserver | null>(null)
	const elementRef = useRef<HTMLElement | null>(null)

	const observe = useCallback(
		(element: HTMLElement) => {
			if (observerRef.current) {
				observerRef.current.disconnect()
			}

			observerRef.current = new ResizeObserver(entries => {
				entries.forEach(callback)
			})

			observerRef.current.observe(element, options)
			elementRef.current = element
		},
		[callback, options]
	)

	const unobserve = useCallback(() => {
		if (observerRef.current) {
			observerRef.current.disconnect()
			observerRef.current = null
		}
		elementRef.current = null
	}, [])

	useEffect(() => {
		return () => {
			unobserve()
		}
	}, [unobserve])

	return {
		observe,
		unobserve,
		elementRef,
	}
}

// メモ化された値のフック
export const useMemoizedValue = <T>(value: T, comparator?: (prev: T, next: T) => boolean) => {
	const prevValueRef = useRef<T>(value)
	const memoizedValueRef = useRef<T>(value)

	if (comparator) {
		if (!comparator(prevValueRef.current, value)) {
			memoizedValueRef.current = value
		}
	} else {
		if (prevValueRef.current !== value) {
			memoizedValueRef.current = value
		}
	}

	prevValueRef.current = value
	return memoizedValueRef.current
}

// レンダリング最適化フック
export const useRenderOptimization = () => {
	const renderCountRef = useRef(0)
	const lastRenderTimeRef = useRef(0)

	const shouldRender = useCallback((dependencies: any[], threshold: number = 16) => {
		const now = performance.now()
		const timeSinceLastRender = now - lastRenderTimeRef.current

		if (timeSinceLastRender < threshold) {
			logger.debug('RenderOptimization', 'Skipping render due to threshold')
			return false
		}

		renderCountRef.current++
		lastRenderTimeRef.current = now
		return true
	}, [])

	const getRenderStats = useCallback(() => {
		return {
			renderCount: renderCountRef.current,
			lastRenderTime: lastRenderTimeRef.current,
		}
	}, [])

	return {
		shouldRender,
		getRenderStats,
	}
}

// イベント最適化フック
export const useEventOptimization = () => {
	const eventCountRef = useRef<Map<string, number>>(new Map())

	const throttleEvent = useCallback(
		<T extends (...args: any[]) => any>(eventName: string, handler: T, delay: number): T => {
			let lastCall = 0
			let timeoutId: NodeJS.Timeout

			return ((...args: Parameters<T>) => {
				const now = Date.now()
				const count = eventCountRef.current.get(eventName) || 0
				eventCountRef.current.set(eventName, count + 1)

				if (now - lastCall >= delay) {
					lastCall = now
					handler(...args)
				} else {
					clearTimeout(timeoutId)
					timeoutId = setTimeout(
						() => {
							lastCall = Date.now()
							handler(...args)
						},
						delay - (now - lastCall)
					)
				}
			}) as T
		},
		[]
	)

	const getEventStats = useCallback((eventName: string) => {
		return eventCountRef.current.get(eventName) || 0
	}, [])

	return {
		throttleEvent,
		getEventStats,
	}
}

// メモリ最適化フック
export const useMemoryOptimization = () => {
	const memoryRef = useRef<Map<string, any>>(new Map())

	const memoize = useCallback(<T>(key: string, value: T, ttl?: number): T => {
		if (ttl) {
			setTimeout(() => {
				memoryRef.current.delete(key)
			}, ttl)
		}
		memoryRef.current.set(key, value)
		return value
	}, [])

	const getMemoized = useCallback(<T>(key: string): T | undefined => {
		return memoryRef.current.get(key)
	}, [])

	const clearMemoized = useCallback((key?: string) => {
		if (key) {
			memoryRef.current.delete(key)
		} else {
			memoryRef.current.clear()
		}
	}, [])

	const getMemoryStats = useCallback(() => {
		return {
			size: memoryRef.current.size,
			keys: Array.from(memoryRef.current.keys()),
		}
	}, [])

	return {
		memoize,
		getMemoized,
		clearMemoized,
		getMemoryStats,
	}
}

// アニメーションフレーム最適化フック
export const useAnimationFrame = () => {
	const animationFrameRef = useRef<number>()

	const requestAnimationFrame = useCallback((callback: () => void) => {
		if (animationFrameRef.current) {
			cancelAnimationFrame()
		}
		animationFrameRef.current = window.requestAnimationFrame(callback)
	}, [])

	const cancelAnimationFrame = useCallback(() => {
		if (animationFrameRef.current) {
			window.cancelAnimationFrame(animationFrameRef.current)
			animationFrameRef.current = undefined
		}
	}, [])

	useEffect(() => {
		return () => {
			cancelAnimationFrame()
		}
	}, [cancelAnimationFrame])

	return {
		requestAnimationFrame,
		cancelAnimationFrame,
	}
}

// バッチ更新フック
export const useBatchUpdate = () => {
	const batchRef = useRef<Set<() => void>>(new Set())
	const isBatchingRef = useRef(false)

	const batchUpdate = useCallback((updates: (() => void)[]) => {
		updates.forEach(update => batchRef.current.add(update))

		if (!isBatchingRef.current) {
			isBatchingRef.current = true
			requestAnimationFrame(() => {
				batchRef.current.forEach(update => update())
				batchRef.current.clear()
				isBatchingRef.current = false
			})
		}
	}, [])

	return {
		batchUpdate,
	}
}
