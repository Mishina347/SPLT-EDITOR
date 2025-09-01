import { useState, useCallback, useMemo } from 'react'
import { PreviewMode } from '../../domain'
import { TabItem } from '../components'

export const usePreviewMode = () => {
	const [mode, setMode] = useState<PreviewMode>(PreviewMode.VERTICAL)
	const [isFocusMode, setIsFocusMode] = useState(false)

	// タブ設定
	const tabs: TabItem[] = useMemo(
		() => [
			{
				id: PreviewMode.VERTICAL,
				label: 'プレビュー',
				ariaLabel: 'テキストのプレビュー表示',
			},
			{
				id: PreviewMode.DIFF,
				label: '差分表示',
				ariaLabel: '変更前後の差分表示',
			},
			{
				id: PreviewMode.HISTORY,
				label: '履歴',
				ariaLabel: 'テキストの編集履歴',
			},
		],
		[]
	)

	const handleTabChange = useCallback(
		(tabId: string) => {
			setMode(tabId as PreviewMode)
			// モード切替時にフォーカスモードを解除
			if (isFocusMode) {
				setIsFocusMode(false)
			}
		},
		[isFocusMode]
	)

	// フォーカスモードハンドラー
	const handleFocusMode = useCallback((focused: boolean) => {
		setIsFocusMode(focused)
	}, [])

	return {
		mode,
		isFocusMode,
		tabs,
		handleTabChange,
		handleFocusMode,
		setIsFocusMode,
	}
}
