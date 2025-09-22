import { useCallback } from 'react'
import { loadText } from '@/usecases'
import { saveEditorSettings } from '@/usecases/editor/SaveEditorSettings'
import { serviceFactory } from '@/infra'
import { logger } from '@/utils/logger'
import { hexToRgba } from '@/utils'
import type { Settings } from '@/domain'

interface UseFileOperationsParams {
	editorSettings: Settings['editor']
	previewSettings: Settings['preview']
	isInitialized: boolean
	setInitialText: (text: string) => void
	setCurrentSavedText: (text: string) => void
	setLastSavedText: (text: string) => void
	updateText: (text: string) => void
	setIsInitialized: (initialized: boolean) => void
	saveSnapshot: (content: string, description: string) => void
}

export const useFileOperations = ({
	editorSettings,
	previewSettings,
	isInitialized,
	setInitialText,
	setCurrentSavedText,
	setLastSavedText,
	updateText,
	setIsInitialized,
	saveSnapshot,
}: UseFileOperationsParams) => {
	// 初期ファイル読み込み
	const initializeApp = useCallback(async () => {
		const initialText = await loadText('document.json')

		// 初回起動時の状態設定
		if (initialText) {
			// ファイルが存在する場合
			setInitialText(initialText)
			setCurrentSavedText(initialText)
			setLastSavedText(initialText)
			// エディタの初期化完了を待ってからテキストを設定
			setTimeout(() => {
				updateText(initialText)
				setIsInitialized(true)
			}, 100)
		} else {
			// 初回起動時（ファイルが存在しない場合）
			setCurrentSavedText('')
			setLastSavedText('') // 明示的に空文字列を設定
		}

		// エディタの初期化完了を待ってからテキストを設定
		setTimeout(() => {
			updateText(initialText)
		}, 100)
	}, [
		setInitialText,
		setCurrentSavedText,
		setLastSavedText,
		updateText,
		setIsInitialized,
	])

	// ファイル読み込み機能
	const handleFileLoad = useCallback(
		(content: string, fileName: string) => {
			// 読み込んだテキストを初期状態として保存
			setCurrentSavedText(content)
			setLastSavedText(content)
			// エディタの内容も更新
			updateText(content)
			// 履歴にファイル読み込みを記録
			saveSnapshot(content, `ファイル読み込み - ${fileName}`)
		},
		[saveSnapshot, updateText, setCurrentSavedText, setLastSavedText]
	)

	// テーマ設定を更新
	const handleThemeUpdate = useCallback(
		(backgroundColor: string, textColor: string, setEditorSettings: (settings: any) => void) => {
			// CSS変数を更新
			document.documentElement.style.setProperty('--app-bg-color', backgroundColor)
			document.documentElement.style.setProperty('--app-text-color', textColor)
			const bgColorAlpha = hexToRgba(backgroundColor, 0.15)
			document.documentElement.style.setProperty('--app-bg-color-alpha', bgColorAlpha)

			const updatedSettings = {
				...editorSettings,
				backgroundColor,
				textColor,
			}
			setEditorSettings(updatedSettings)
		},
		[editorSettings]
	)

	// 設定の自動保存
	const saveSettings = useCallback(async () => {
		try {
			const fileDataRepository = serviceFactory.getFileDataRepository()
			const fullSettings = {
				editor: editorSettings,
				preview: previewSettings,
			}
			await saveEditorSettings(fileDataRepository, fullSettings)
			logger.debug('useFileOperations', 'Settings auto-saved successfully')
		} catch (error) {
			logger.error('useFileOperations', 'Failed to auto-save settings', error)
		}
	}, [editorSettings, previewSettings])

	// リサイザー比率の保存
	const saveResizerRatio = useCallback(
		async (ratio: number) => {
			try {
				const fileDataRepository = serviceFactory.getFileDataRepository()
				const fullSettings = {
					editor: editorSettings,
					preview: previewSettings,
					resizerRatio: ratio,
				}
				await saveEditorSettings(fileDataRepository, fullSettings)
				logger.debug('useFileOperations', `Resizer ratio saved: ${ratio}%`)
			} catch (error) {
				logger.error('useFileOperations', 'Failed to save resizer ratio', error)
			}
		},
		[editorSettings, previewSettings]
	)

	return {
		initializeApp,
		handleFileLoad,
		handleThemeUpdate,
		saveSettings,
		saveResizerRatio,
	}
}
