import { useCallback } from 'react'

interface UsePreviewKeyboardProps {
	pageIndex: number
	pagesLength: number
	notInitPage: boolean
	notLastPage: boolean
	isFocusMode: boolean
	onPrev: () => void
	onNext: () => void
	onGoToFirst: () => void
	onGoToLast: () => void
	onGoToPage: (page: number) => void
	onFocusModeChange: (focused: boolean) => void
}

export const usePreviewKeyboard = ({
	pageIndex,
	pagesLength,
	notInitPage,
	notLastPage,
	isFocusMode,
	onPrev,
	onNext,
	onGoToFirst,
	onGoToLast,
	onGoToPage,
	onFocusModeChange,
}: UsePreviewKeyboardProps) => {
	// キーボードイベントハンドラー
	const handleKeyDown = useCallback(
		(e: React.KeyboardEvent) => {
			// プレビューエリアにフォーカスがある時のみ処理
			if (e.currentTarget !== e.target) return

			let handled = false

			switch (e.key) {
				case 'ArrowLeft':
				case 'ArrowUp':
					// 左矢印・上矢印 → 次のページ（縦書きレイアウトでは左が次）
					if (notLastPage) {
						onNext()
						handled = true
					}
					break
				case 'ArrowRight':
				case 'ArrowDown':
					// 右矢印・下矢印 → 前のページ（縦書きレイアウトでは右が前）
					if (notInitPage) {
						onPrev()
						handled = true
					}
					break
				case 'Home':
					// Homeキー → 最初のページ
					if (pageIndex !== 0) {
						onGoToFirst()
						handled = true
					}
					break
				case 'End':
					// Endキー → 最後のページ
					if (pageIndex !== pagesLength - 1) {
						onGoToLast()
						handled = true
					}
					break
				case 'PageUp':
					// PageUpキー → 前のページ（複数ページ戻る）
					if (notInitPage) {
						onGoToPage(Math.max(0, pageIndex - 5))
						handled = true
					}
					break
				case 'PageDown':
					// PageDownキー → 次のページ（複数ページ進む）
					if (notLastPage) {
						onGoToPage(Math.min(pagesLength - 1, pageIndex + 5))
						handled = true
					}
					break
				case 'Escape':
					// Escapeキー → フォーカスモード解除
					if (isFocusMode) {
						onFocusModeChange(false)
						handled = true
					}
					break
			}

			if (handled) {
				e.preventDefault()
				e.stopPropagation()
			}
		},
		[
			pageIndex,
			pagesLength,
			notInitPage,
			notLastPage,
			isFocusMode,
			onPrev,
			onNext,
			onGoToFirst,
			onGoToLast,
			onGoToPage,
			onFocusModeChange,
		]
	)

	return {
		handleKeyDown,
	}
}
