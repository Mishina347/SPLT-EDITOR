import React, { useState, useCallback, useMemo } from 'react'
import { DISPLAY_MODE, PREVIEW_CONSTANTS } from '../../domain'
import { useViewportSize } from './useViewportSize'
import { formatNumber, UI_CONSTANTS } from '../../utils'

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

interface ContainerConfig {
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
		const maximizedInitialSize = {
			width: Math.max(800, viewportWidth - 200),
			height: Math.max(600, viewportHeight - 100),
		}

		return {
			standard: {
				minSize: standardMinSize,
				maxSize: standardMaxSize,
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

			return {
				title: titleWithCharCount,
				initialPosition: isMaximizedMode ? { x: 20, y: 100 } : editorPosition,
				initialSize: isMaximizedMode ? (sizes as any).initialSize || editorSize : editorSize,
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

			return {
				title: baseTitle,
				initialPosition: isMaximizedMode ? { x: 20, y: 100 } : previewPosition,
				initialSize: isMaximizedMode ? (sizes as any).initialSize || previewSize : previewSize,
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
	const layoutType = useMemo(() => {
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
