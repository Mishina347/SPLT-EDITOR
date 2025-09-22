import { useEffect } from 'react'
import { hexToRgba } from '@/utils'

interface UseAppInitializationParams {
	editorSettings: {
		backgroundColor: string
		textColor: string
	}
	isDraggableMode: boolean
	lastDraggableEditorSize: { width: number; height: number }
	lastDraggablePreviewSize: { width: number; height: number }
	setEditorSize: (size: { width: number; height: number }) => void
	setPreviewSize: (size: { width: number; height: number }) => void
	editorSize: { width: number; height: number }
	previewSize: { width: number; height: number }
	setLastDraggableEditorSize: (size: { width: number; height: number }) => void
	setLastDraggablePreviewSize: (size: { width: number; height: number }) => void
	initializeApp: () => Promise<void>
}

export const useAppInitialization = ({
	editorSettings,
	isDraggableMode,
	lastDraggableEditorSize,
	lastDraggablePreviewSize,
	setEditorSize,
	setPreviewSize,
	editorSize,
	previewSize,
	setLastDraggableEditorSize,
	setLastDraggablePreviewSize,
	initializeApp,
}: UseAppInitializationParams) => {
	// 初期化時にCSS変数を設定
	useEffect(() => {
		document.documentElement.style.setProperty('--app-bg-color', editorSettings.backgroundColor)
		document.documentElement.style.setProperty('--app-text-color', editorSettings.textColor)
		const bgColorAlpha = hexToRgba(editorSettings.backgroundColor, 0.15)
		document.documentElement.style.setProperty('--app-bg-color-alpha', bgColorAlpha)
	}, [editorSettings.backgroundColor, editorSettings.textColor])

	// draggableモードの変更を監視してサイズを復元
	useEffect(() => {
		if (isDraggableMode) {
			// draggableモードが有効になった時、最後のサイズを復元
			if (lastDraggableEditorSize.width !== 800 || lastDraggableEditorSize.height !== 600) {
				setEditorSize(lastDraggableEditorSize)
			}
			if (lastDraggablePreviewSize.width !== 600 || lastDraggablePreviewSize.height !== 400) {
				setPreviewSize(lastDraggablePreviewSize)
			}
		}
	}, [
		isDraggableMode,
		lastDraggableEditorSize,
		lastDraggablePreviewSize,
		setEditorSize,
		setPreviewSize,
	])

	// ウィンドウリサイズ時にdraggableモードのサイズを保持
	useEffect(() => {
		const handleWindowResize = () => {
			if (isDraggableMode) {
				// 現在のサイズを保存
				setLastDraggableEditorSize(editorSize)
				setLastDraggablePreviewSize(previewSize)
			}
		}

		window.addEventListener('resize', handleWindowResize)
		return () => window.removeEventListener('resize', handleWindowResize)
	}, [
		isDraggableMode,
		editorSize,
		previewSize,
		setLastDraggableEditorSize,
		setLastDraggablePreviewSize,
	])

	// アプリ初期化
	useEffect(() => {
		initializeApp()
	}, [initializeApp])

	return {}
}
