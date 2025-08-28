import { useCallback, useRef } from 'react'
import type { editor } from 'monaco-editor'

/**
 * Monaco Editorのレイアウト更新を最適化するカスタムフック
 */
export const useOptimizedLayout = () => {
	const layoutTimeoutRef = useRef<NodeJS.Timeout | null>(null)
	const isLayoutScheduledRef = useRef(false)

	/**
	 * 最適化されたレイアウト更新
	 * 連続したレイアウト更新を防ぎ、パフォーマンスを向上
	 */
	const updateLayout = useCallback((editor: editor.IStandaloneCodeEditor | null) => {
		if (!editor) return

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
				editor.layout()
			} catch (error) {
				console.warn('Layout update failed:', error)
			} finally {
				isLayoutScheduledRef.current = false
			}
		}, 16)
	}, [])

	/**
	 * 即座のレイアウト更新（緊急時用）
	 */
	const updateLayoutImmediate = useCallback((editor: editor.IStandaloneCodeEditor | null) => {
		if (!editor) return

		// 既存のタイマーをクリア
		if (layoutTimeoutRef.current) {
			clearTimeout(layoutTimeoutRef.current)
			layoutTimeoutRef.current = null
		}

		isLayoutScheduledRef.current = false

		try {
			editor.layout()
		} catch (error) {
			console.warn('Immediate layout update failed:', error)
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
