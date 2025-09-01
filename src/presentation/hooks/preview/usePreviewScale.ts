import { useState, useCallback, useEffect, useMemo, RefObject } from 'react'
import { ScaleInfo } from '@/types/common'
import { usePerformanceOptimization, useResizeObserver } from '../common'
import { calculateScaleWithViewport } from '@/utils'
import { logger } from '@/utils/logger'
import { useOptimizedPreviewLayout } from '../layout'

interface UsePreviewScaleProps {
	containerRef: RefObject<HTMLDivElement>
	isMaximized: boolean
}

export const usePreviewScale = ({ containerRef, isMaximized }: UsePreviewScaleProps) => {
	// 倍率計算の状態
	const [scaleInfo, setScaleInfo] = useState<ScaleInfo>({
		zoom: 1,
		transformScale: 1,
		totalScale: 1,
		viewportScale: 1,
	})

	// パフォーマンス最適化フック
	const { debounce } = usePerformanceOptimization()

	// 最適化されたプレビューレイアウト更新フック
	const { updateLayout, updateLayoutImmediate, cleanup: cleanupLayout } = useOptimizedPreviewLayout()

	// 倍率計算のロジック
	const updateScaleInfo = useCallback(() => {
		if (containerRef.current) {
			const newScaleInfo = calculateScaleWithViewport(containerRef.current)
			setScaleInfo(newScaleInfo)

			logger.debug('RightPane', 'Scale info updated', {
				element: 'RightPane',
				...newScaleInfo,
			})
		}
	}, [containerRef])

	// 最適化されたResizeObserver
	const debouncedUpdateScaleInfo = useMemo(
		() =>
			debounce(() => {
				logger.debug('RightPane', 'Debounced update triggered')
				updateScaleInfo()
				// レイアウト更新も最適化
				updateLayout(containerRef.current)
			}, 100),
		[debounce, updateScaleInfo, updateLayout, containerRef]
	)

	const { observe, unobserve } = useResizeObserver(debouncedUpdateScaleInfo)

	// 倍率計算の初期化と監視（最適化版）
	useEffect(() => {
		logger.debug('RightPane', 'Setting up ResizeObserver')

		// 初期倍率を計算
		updateScaleInfo()

		// ResizeObserverでサイズ変更を監視
		if (containerRef.current) {
			observe(containerRef.current)
		}

		return () => {
			logger.debug('RightPane', 'Cleaning up ResizeObserver')
			unobserve()
			// レイアウト更新のクリーンアップ
			cleanupLayout()
		}
	}, [updateScaleInfo, observe, unobserve, cleanupLayout, containerRef])

	// 最大化状態の変更を監視してレイアウトを更新（最適化版）
	useEffect(() => {
		if (isMaximized && containerRef.current) {
			logger.debug('RightPane', 'Maximized state changed, updating layout')
			// 最大化時に最適化されたレイアウト更新
			requestAnimationFrame(() => {
				updateScaleInfo()
				updateLayoutImmediate(containerRef.current)
			})
		}
	}, [isMaximized, updateScaleInfo, updateLayoutImmediate, containerRef])

	return {
		scaleInfo,
		updateLayout,
	}
}
