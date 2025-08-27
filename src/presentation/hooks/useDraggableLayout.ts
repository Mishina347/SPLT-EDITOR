import React, { useCallback, useMemo } from 'react'
import { DISPLAY_MODE } from '../../domain'
import { useViewportSize } from './useViewportSize'
import { formatNumber, UI_CONSTANTS } from '../../utils'
import { LayoutType } from '../components/layout/LayoutRenderer'

export interface ContainerConfig {
	title: string
	initialPosition: { x: number; y: number }
	initialSize: { width: number; height: number }
	minSize: { width: number; height: number }
	maxSize: { width: number; height: number }
	isMaximized: boolean
	zIndex?: number
	onPositionChange: (position: { x: number; y: number }) => void
	onSizeChange: (size: { width: number; height: number }) => void
	onFocus?: () => void
	// カスタムヘッダー用
	customHeader?: React.ReactNode
	showDefaultHeader?: boolean
}

interface DraggableLayoutConfig {
	editorPosition: { x: number; y: number }
	editorSize: { width: number; height: number }
	previewPosition: { x: number; y: number }
	previewSize: { width: number; height: number }
	setEditorPosition: (position: { x: number; y: number }) => void
	setEditorSize: (size: { width: number; height: number }) => void
	setPreviewPosition: (position: { x: number; y: number }) => void
	setPreviewSize: (size: { width: number; height: number }) => void
}

interface UseDraggableLayoutOptions {
	isDraggableMode: boolean
	viewMode: DISPLAY_MODE
	charCount: number
	pageInfo?: { currentPage: number; totalPages: number }
}

export const useDraggableLayout = (
	{
		editorPosition,
		editorSize,
		previewPosition,
		previewSize,
		setEditorPosition,
		setEditorSize,
		setPreviewPosition,
		setPreviewSize,
	}: DraggableLayoutConfig,
	{ isDraggableMode, viewMode, pageInfo, charCount }: UseDraggableLayoutOptions
) => {
	const { width: viewportWidth, height: viewportHeight } = useViewportSize()

	// 共通のサイズ設定を計算
	const commonSizes = useMemo(() => {
		const standardMinSize = UI_CONSTANTS.DRAGGABLE_CONTAINER.MIN_SIZE
		const standardMaxSize = {
			width: viewportWidth,
			height: viewportHeight, // ツールバーとマージンを考慮
		}
		const maximizedMinSize = UI_CONSTANTS.DRAGGABLE_CONTAINER.MAX_SIZE
		const maximizedMaxSize = {
			width: viewportWidth,
			height: viewportHeight, // ツールバーとマージンを考慮
		}

		const standardInitialSize = {
			width: 400,
			height: 300,
		}

		const maximizedInitialSize = {
			width: Math.max(800, viewportWidth - 200),
			height: Math.max(600, viewportHeight - 100),
		}

		return {
			standard: {
				minSize: standardMinSize,
				maxSize: standardMaxSize,
				initialSize: standardInitialSize,
			},
			maximized: {
				minSize: maximizedMinSize,
				maxSize: maximizedMaxSize,
				initialSize: maximizedInitialSize,
			},
		}
	}, [viewportWidth, viewportHeight])

	// エディターコンテナの設定を生成
	const getEditorContainerConfig = useCallback(
		(isMaximized = false, zIndex?: number, onFocus?: () => void): ContainerConfig => {
			const isMaximizedMode = isMaximized || viewMode === DISPLAY_MODE.EDITOR
			const sizes = isMaximizedMode ? commonSizes.maximized : commonSizes.standard
			const baseTitle = isMaximizedMode ? 'エディター (最大化)' : 'エディター'
			const titleWithCharCount =
				charCount !== undefined ? `${baseTitle} - ${formatNumber(charCount)}文字` : baseTitle

			// 現在のサイズが初期サイズと異なる場合は、現在のサイズを優先
			const currentSize =
				editorSize.width !== 800 || editorSize.height !== 600
					? editorSize
					: isMaximizedMode
						? sizes.initialSize
						: editorSize

			return {
				title: titleWithCharCount,
				initialPosition: isMaximizedMode ? { x: 20, y: 100 } : editorPosition,
				initialSize: currentSize,
				minSize: sizes.minSize,
				maxSize: sizes.maxSize,
				isMaximized: isMaximizedMode,
				zIndex,
				onPositionChange: setEditorPosition,
				onSizeChange: setEditorSize,
				onFocus,
			}
		},
		[editorPosition, editorSize, setEditorPosition, setEditorSize, viewMode, commonSizes, charCount]
	)

	// プレビューコンテナの設定を生成
	const getPreviewContainerConfig = useCallback(
		(isMaximized = false, zIndex?: number, onFocus?: () => void): ContainerConfig => {
			const isMaximizedMode = isMaximized || viewMode === DISPLAY_MODE.PREVIEW
			const sizes = isMaximizedMode ? commonSizes.maximized : commonSizes.standard

			let baseTitle = isMaximizedMode ? 'プレビュー (最大化)' : 'プレビュー'

			// ページ情報を追加
			if (pageInfo && pageInfo.totalPages > 1) {
				baseTitle += ` - ${pageInfo.currentPage} / ${pageInfo.totalPages} ページ目`
			}

			// 現在のサイズが初期サイズと異なる場合は、現在のサイズを優先
			const currentSize =
				previewSize.width !== 600 || previewSize.height !== 400
					? previewSize
					: isMaximizedMode
						? sizes.initialSize
						: previewSize

			return {
				title: baseTitle,
				initialPosition: isMaximizedMode ? { x: 20, y: 100 } : previewPosition,
				initialSize: currentSize,
				minSize: sizes.minSize,
				maxSize: sizes.maxSize,
				isMaximized: isMaximizedMode,
				zIndex,
				onPositionChange: setPreviewPosition,
				onSizeChange: setPreviewSize,
				onFocus,
			}
		},
		[
			previewPosition,
			previewSize,
			setPreviewPosition,
			setPreviewSize,
			viewMode,
			commonSizes,
			pageInfo,
		]
	)

	// レイアウトタイプを判定
	const layoutType = useMemo<LayoutType>(() => {
		if (!isDraggableMode) return 'fixed'
		if (viewMode === DISPLAY_MODE.BOTH) return 'draggable-dual'
		if (viewMode === DISPLAY_MODE.EDITOR) return 'draggable-editor'
		if (viewMode === DISPLAY_MODE.PREVIEW) return 'draggable-preview'
		return 'fixed'
	}, [isDraggableMode, viewMode])

	return {
		layoutType,
		getEditorContainerConfig,
		getPreviewContainerConfig,
		viewportSize: { width: viewportWidth, height: viewportHeight },
	}
}
