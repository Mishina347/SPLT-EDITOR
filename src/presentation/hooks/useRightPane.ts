import { useRef, useMemo, useCallback, RefObject } from 'react'
import { PreviewMode, LayoutConfig, TextSnapshot } from '../../domain'
import { useFocusTrap } from './useFocusTrap'
import { useDiffCalculation } from './useDiffCalculation'
import { usePreviewMode } from './usePreviewMode'
import { usePreviewScale } from './usePreviewScale'
import { usePreviewHistory } from './usePreviewHistory'
import { usePreviewPagination } from './usePreviewPagination'

interface UseRightPaneProps {
	currentSavedText: string
	currentNotSavedText: string
	initialText: string
	setInitialText: (text: string) => void
	previewSetting: LayoutConfig
	textHistory: TextSnapshot[]
	isMaximized: boolean
	onRestoreHistory?: (snapshot: TextSnapshot) => void
	onPageInfoChange?: (currentPage: number, totalPages: number) => void
}

export const useRightPane = ({
	currentSavedText,
	currentNotSavedText,
	initialText,
	setInitialText,
	previewSetting,
	textHistory,
	isMaximized,
	onRestoreHistory,
	onPageInfoChange,
}: UseRightPaneProps) => {
	const containerRef = useRef<HTMLDivElement>(null)

	// プレビューモード管理
	const { mode, isFocusMode, tabs, handleTabChange, handleFocusMode, setIsFocusMode } =
		usePreviewMode()

	// スケール計算管理
	const { scaleInfo, updateLayout } = usePreviewScale({
		containerRef,
		isMaximized,
	})

	// 差分計算管理
	const { diffHtml } = useDiffCalculation({
		isDiffMode: mode === PreviewMode.DIFF,
		initialText,
		currentNotSavedText,
	})

	// 履歴管理
	const {
		selectedSnapshotId,
		showHistoryDetailDialog,
		handleSnapshotSelect,
		handleCloseHistoryDialog,
	} = usePreviewHistory({
		textHistory,
		onRestoreHistory,
	})

	// ページネーション管理
	const { currentPageInfo, handleInternalPageInfoChange } = usePreviewPagination(onPageInfoChange)

	// 差分表示モードでのフォーカストラップ
	const diffFocusTrapRef = useFocusTrap(mode === PreviewMode.DIFF)

	// プレビュー設定のメモ化
	const previewConfig = useMemo(
		() => ({
			charsPerLine: previewSetting.charsPerLine,
			linesPerPage: previewSetting.linesPerPage,
			fontSize: previewSetting.fontSize,
			fontFamily: previewSetting.fontFamily,
		}),
		[previewSetting]
	)

	// フォーカスモードハンドラー（最適化版）
	const optimizedHandleFocusMode = useCallback(
		(focused: boolean) => {
			handleFocusMode(focused)

			// フォーカス時にレイアウトを最適化
			if (focused && containerRef.current) {
				updateLayout(containerRef.current)
			}
		},
		[handleFocusMode, updateLayout]
	)

	return {
		// refs
		containerRef,
		diffFocusTrapRef,

		// state
		mode,
		isFocusMode,
		scaleInfo,
		diffHtml,
		currentPageInfo,
		selectedSnapshotId,
		showHistoryDetailDialog,

		// config
		tabs,
		previewConfig,

		// handlers
		handleTabChange,
		optimizedHandleFocusMode,
		handleInternalPageInfoChange,
		handleSnapshotSelect,
		handleCloseHistoryDialog,
		setIsFocusMode,
		setInitialText,

		// data
		currentSavedText,
		currentNotSavedText,
		initialText,
		textHistory,
		onRestoreHistory,
	}
}
