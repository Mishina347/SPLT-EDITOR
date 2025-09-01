import { useCallback, useRef } from 'react'

/**
 * プレビュー画面のレイアウト更新を最適化するカスタムフック
 */
export const useOptimizedPreviewLayout = () => {
	const layoutTimeoutRef = useRef<NodeJS.Timeout | null>(null)
	const isLayoutScheduledRef = useRef(false)

	/**
	 * 最適化されたレイアウト更新
	 * 連続したレイアウト更新を防ぎ、パフォーマンスを向上
	 */
	const updateLayout = useCallback((element: HTMLElement | null) => {
		if (!element) return

		// 既にレイアウト更新がスケジュールされている場合はスキップ
		if (isLayoutScheduledRef.current) return

		isLayoutScheduledRef.current = true

		// 既存のタイマーをクリア
		if (layoutTimeoutRef.current) {
			clearTimeout(layoutTimeoutRef.current)
		}

		// レイアウト更新をスケジュール（16ms = 60fps）
		layoutTimeoutRef.current = setTimeout(() => {
			try {
				// プレビュー要素のレイアウトを更新
				element.style.display = 'none'
				element.offsetHeight // 強制的にリフロー
				element.style.display = ''
			} catch (error) {
				console.warn('Preview layout update failed:', error)
			} finally {
				isLayoutScheduledRef.current = false
			}
		}, 16)
	}, [])

	/**
	 * 即座のレイアウト更新（緊急時用）
	 */
	const updateLayoutImmediate = useCallback((element: HTMLElement | null) => {
		if (!element) return

		// 既存のタイマーをクリア
		if (layoutTimeoutRef.current) {
			clearTimeout(layoutTimeoutRef.current)
			layoutTimeoutRef.current = null
		}

		isLayoutScheduledRef.current = false

		try {
			// プレビュー要素のレイアウトを即座に更新
			element.style.display = 'none'
			element.offsetHeight // 強制的にリフロー
			element.style.display = ''
		} catch (error) {
			console.warn('Immediate preview layout update failed:', error)
		}
	}, [])

	/**
	 * クリーンアップ
	 */
	const cleanup = useCallback(() => {
		if (layoutTimeoutRef.current) {
			clearTimeout(layoutTimeoutRef.current)
			layoutTimeoutRef.current = null
		}
		isLayoutScheduledRef.current = false
	}, [])

	return {
		updateLayout,
		updateLayoutImmediate,
		cleanup,
	}
}
