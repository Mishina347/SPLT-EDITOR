export { useCharCount } from './useCharCount'
export { useTextHistory } from './useTextHistory'
export { useAutoSave } from './useAutoSave'
export { useSwipeGesture } from './useSwipeGesture'
export { useResizable } from './useResizable'
export { useFocusTrap } from './useFocusTrap'
export { useDraggableResize } from './useDraggableResize'
export type {
	DraggableResizeState,
	DraggableResizeHandlers,
	ResizeDirection,
} from './useDraggableResize'
export { useViewportSize } from './useViewportSize'
export { useOptimizedLayout } from './useOptimizedLayout'
export { useOptimizedPreviewLayout } from './useOptimizedPreviewLayout'
export { useDraggableLayout } from './useDraggableLayout'
export { usePinchZoom } from './usePinchZoom'
export { useFullscreen } from './useFullscreen'
export { useToolbarOverflow } from './useToolbarOverflow'

export type { PinchZoomState } from './usePinchZoom'

// パフォーマンス最適化フック
export {
	usePerformanceOptimization,
	useVirtualization,
	useResizeObserver,
	useMemoizedValue,
	useRenderOptimization,
	useEventOptimization,
	useMemoryOptimization,
	useAnimationFrame,
	useBatchUpdate,
} from './usePerformanceOptimization'

export { usePreviewNavigation } from './usePreviewNavigation'
export { usePreviewInteraction } from './usePreviewInteraction'
export { useDiffDisplay, useRightPaneDiff, useHistoryDiff } from './useDiffDisplay'
export { useMonacoEditor } from './useMonacoEditor'
export { useOptimizedCharCount } from './useOptimizedCharCount'
export { usePerformanceMonitor } from './usePerformanceMonitor'
export { useDebounce, useDebouncedCallback, useThrottledCallback } from './useDebounce'

// HamburgerMenu関連のフック
export { useHamburgerMenu } from './useHamburgerMenu'
export { useMenuPosition } from './useMenuPosition'
export { useMenuKeyboard } from './useMenuKeyboard'
export { usePWAMenu } from './usePWAMenu'
