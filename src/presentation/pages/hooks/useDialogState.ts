import { useCallback } from 'react'

interface UseDialogStateParams {
	setShowThemeEditDialog: (show: boolean) => void
	setShowExportDialog: (show: boolean) => void
	setShowSaveConfirm: (show: boolean) => void
	setPendingAction: (action: (() => void) | null) => void
}

export const useDialogState = ({
	setShowThemeEditDialog,
	setShowExportDialog,
	setShowSaveConfirm,
	setPendingAction,
}: UseDialogStateParams) => {
	// テーマ編集ダイアログを閉じる
	const handleCloseThemeEditDialog = useCallback(() => {
		setShowThemeEditDialog(false)
	}, [setShowThemeEditDialog])

	// 書き出しダイアログを開く
	const handleOpenExportDialog = useCallback(
		(hasUnsavedChanges: boolean) => {
			if (hasUnsavedChanges) {
				setPendingAction(() => setShowExportDialog(true))
				setShowSaveConfirm(true)
				return
			}
			setShowExportDialog(true)
		},
		[setShowExportDialog, setShowSaveConfirm, setPendingAction]
	)

	// 書き出しダイアログを閉じる
	const handleCloseExportDialog = useCallback(() => {
		setShowExportDialog(false)
	}, [setShowExportDialog])

	// 保存確認モーダルのボタン動作
	const handleConfirmSaveAndContinue = useCallback(
		async (forceSave: () => Promise<void>, currentNotSavedText: string, setLastSavedText: (text: string) => void, setCurrentSavedText: (text: string) => void) => {
			try {
				await forceSave()
				setLastSavedText(currentNotSavedText)
				setCurrentSavedText(currentNotSavedText)
			} finally {
				setShowSaveConfirm(false)
				// 保留中アクションを実行
				setPendingAction(null)
			}
		},
		[setShowSaveConfirm, setPendingAction]
	)

	const handleDiscardAndContinue = useCallback(() => {
		setShowSaveConfirm(false)
		setPendingAction(null)
	}, [setShowSaveConfirm, setPendingAction])

	const handleCancelContinue = useCallback(() => {
		setShowSaveConfirm(false)
		setPendingAction(null)
	}, [setShowSaveConfirm, setPendingAction])

	return {
		handleCloseThemeEditDialog,
		handleOpenExportDialog,
		handleCloseExportDialog,
		handleConfirmSaveAndContinue,
		handleDiscardAndContinue,
		handleCancelContinue,
	}
}
