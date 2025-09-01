import { useState, useEffect, useCallback } from 'react'
import { diffDisplayService, DiffOptions } from '@/application/diff/DiffDisplayService'

interface UseDiffDisplayProps {
	oldText: string
	newText: string
	enabled: boolean
	options?: DiffOptions
}

export const useDiffDisplay = ({ oldText, newText, enabled, options }: UseDiffDisplayProps) => {
	const [diffHtml, setDiffHtml] = useState('')
	const [isLoading, setIsLoading] = useState(false)
	const [error, setError] = useState<string | null>(null)

	// 差分計算（enabledがtrueの時のみ実行）
	useEffect(() => {
		if (!enabled) {
			setDiffHtml('')
			return
		}

		setIsLoading(true)
		setError(null)

		try {
			const html = diffDisplayService.generateDiffHtml(
				oldText,
				newText,
				'previous',
				'current',
				options
			)
			setDiffHtml(html)
		} catch (err) {
			setError(err instanceof Error ? err.message : '差分の生成に失敗しました')
			setDiffHtml('')
		} finally {
			setIsLoading(false)
		}
	}, [oldText, newText, enabled, options])

	// DOM調整用のコールバック
	const adjustDiffDisplay = useCallback((container: HTMLElement) => {
		diffDisplayService.adjustDiffDisplay(container)
	}, [])

	// 差分統計の取得
	const getDiffStats = useCallback(() => {
		return diffDisplayService.getDiffStats(oldText, newText)
	}, [oldText, newText])

	return {
		diffHtml,
		isLoading,
		error,
		adjustDiffDisplay,
		getDiffStats,
	}
}

// RightPane専用のフック
export const useRightPaneDiff = (oldText: string, newText: string, enabled: boolean) => {
	return useDiffDisplay({
		oldText,
		newText,
		enabled,
		options: {
			drawFileList: false,
			matching: 'lines',
			outputFormat: 'line-by-line',
		},
	})
}

// 履歴比較専用のフック
export const useHistoryDiff = (oldText: string, newText: string, enabled: boolean) => {
	return useDiffDisplay({
		oldText,
		newText,
		enabled,
		options: {
			drawFileList: false,
			matching: 'lines',
			outputFormat: 'side-by-side',
		},
	})
}
