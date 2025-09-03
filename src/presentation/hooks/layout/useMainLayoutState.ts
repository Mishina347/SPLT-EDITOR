import { useState, useCallback, useEffect } from 'react'
import { logger } from '@/utils/logger'
import { DISPLAY_MODE } from '@/domain'
import { EditorUIState, EditorSettings, LayoutConfig } from '@/domain'

interface UseMainLayoutStateProps {
	initSettings: {
		editor: EditorSettings
		preview: LayoutConfig
		resizerRatio?: number
	}
}

export const useMainLayoutState = ({ initSettings }: UseMainLayoutStateProps) => {
	// エディタ設定
	const [editorSettings, setEditorSettings] = useState<EditorSettings>(initSettings.editor)
	const [previewSettings, setPreviewSettings] = useState<LayoutConfig>(initSettings.preview)

	// initSettingsの変更を監視して設定を更新
	useEffect(() => {
		logger.info('EditorPage', 'Settings updated', initSettings)
		setEditorSettings(initSettings.editor)
		setPreviewSettings(initSettings.preview)
		// resizerRatioも更新
		if (initSettings.resizerRatio !== undefined) {
			setCurrentEditorSize(initSettings.resizerRatio)
		}
	}, [initSettings])

	// 表示モード
	const [viewMode, setViewMode] = useState<DISPLAY_MODE>(DISPLAY_MODE.BOTH)
	const [focusedPane, setFocusedPane] = useState<DISPLAY_MODE>(DISPLAY_MODE.BOTH)

	// 最大化状態
	const [isEditorMaximized, setIsEditorMaximized] = useState(false)
	const [isPreviewMaximized, setIsPreviewMaximized] = useState(false)

	// UI状態
	const [uiState, setUIState] = useState<EditorUIState>({
		showToolbar: true,
		showPreview: true,
	})

	// ドラッグ可能モード
	const [isDraggableMode, setIsDraggableMode] = useState(false)

	// フォーカス管理
	const [focusedContainer, setFocusedContainer] = useState<'editor' | 'preview'>('preview')

	// 位置・サイズ
	const [editorPosition, setEditorPosition] = useState({ x: 20, y: 200 })
	const [editorSize, setEditorSize] = useState({ width: 800, height: 600 })
	const [previewPosition, setPreviewPosition] = useState({ x: 620, y: 200 })
	const [previewSize, setPreviewSize] = useState({ width: 600, height: 400 })

	// ダイアログ状態
	const [showThemeEditDialog, setShowThemeEditDialog] = useState(false)
	const [showExportDialog, setShowExportDialog] = useState(false)

	// ページ情報
	const [pageInfo, setPageInfo] = useState({ currentPage: 1, totalPages: 1 })

	// テキスト状態
	const [currentSavedText, setCurrentSavedText] = useState('')
	const [initialText, setInitialText] = useState('')
	const [lastSavedText, setLastSavedText] = useState('')

	// ツールバー表示モード
	const [toolbarDisplayMode, setToolbarDisplayMode] = useState<DISPLAY_MODE>(DISPLAY_MODE.BOTH)

	// エディタサイズ
	const [currentEditorSize, setCurrentEditorSize] = useState(initSettings.resizerRatio || 60)

	// ドラッグ可能サイズ
	const [lastDraggableEditorSize, setLastDraggableEditorSize] = useState({ width: 800, height: 600 })
	const [lastDraggablePreviewSize, setLastDraggablePreviewSize] = useState({
		width: 600,
		height: 400,
	})

	// ページ情報更新のコールバック
	const handlePageInfoChange = useCallback((currentPage: number, totalPages: number) => {
		setPageInfo({ currentPage, totalPages })
	}, [])

	// 最大化ハンドラー
	const handleMaximize = useCallback(
		(target: DISPLAY_MODE) => {
			if (target === DISPLAY_MODE.EDITOR) {
				if (isEditorMaximized) {
					setIsEditorMaximized(false)
					setViewMode(DISPLAY_MODE.BOTH)
				} else {
					setIsEditorMaximized(true)
					setIsPreviewMaximized(false)
					setViewMode(DISPLAY_MODE.EDITOR)
				}
			} else if (target === DISPLAY_MODE.PREVIEW) {
				if (isPreviewMaximized) {
					setIsPreviewMaximized(false)
					setViewMode(DISPLAY_MODE.BOTH)
				} else {
					setIsPreviewMaximized(true)
					setIsEditorMaximized(false)
					setViewMode(DISPLAY_MODE.PREVIEW)
				}
			}
		},
		[isEditorMaximized, isPreviewMaximized]
	)

	// 最大化状態リセット
	const resetMaximizedState = useCallback(() => {
		setIsEditorMaximized(false)
		setIsPreviewMaximized(false)
		setViewMode(DISPLAY_MODE.BOTH)
	}, [])

	// 最大化状態取得
	const getMaximizedState = useCallback(
		(target: DISPLAY_MODE) => {
			if (target === DISPLAY_MODE.EDITOR) {
				return isEditorMaximized
			} else if (target === DISPLAY_MODE.PREVIEW) {
				return isPreviewMaximized
			}
			return false
		},
		[isEditorMaximized, isPreviewMaximized]
	)

	// Z-index計算
	const getZIndex = useCallback(
		(containerType: 'editor' | 'preview') => {
			const unfocusedZIndex = 50
			const focusedZIndex = 100
			return focusedContainer === containerType ? focusedZIndex : unfocusedZIndex
		},
		[focusedContainer]
	)

	return {
		// 状態
		editorSettings,
		previewSettings,
		viewMode,
		focusedPane,
		isEditorMaximized,
		isPreviewMaximized,
		uiState,
		isDraggableMode,
		focusedContainer,
		editorPosition,
		editorSize,
		previewPosition,
		previewSize,
		showThemeEditDialog,
		showExportDialog,
		pageInfo,
		currentSavedText,
		initialText,
		lastSavedText,
		toolbarDisplayMode,
		currentEditorSize,
		lastDraggableEditorSize,
		lastDraggablePreviewSize,

		// セッター
		setEditorSettings,
		setPreviewSettings,
		setViewMode,
		setFocusedPane,
		setIsEditorMaximized,
		setIsPreviewMaximized,
		setUIState,
		setIsDraggableMode,
		setFocusedContainer,
		setEditorPosition,
		setEditorSize,
		setPreviewPosition,
		setPreviewSize,
		setShowThemeEditDialog,
		setShowExportDialog,
		setPageInfo,
		setCurrentSavedText,
		setInitialText,
		setLastSavedText,
		setToolbarDisplayMode,
		setCurrentEditorSize,
		setLastDraggableEditorSize,
		setLastDraggablePreviewSize,

		// ハンドラー
		handleMaximize,
		resetMaximizedState,
		getMaximizedState,
		getZIndex,
		handlePageInfoChange,
	}
}
