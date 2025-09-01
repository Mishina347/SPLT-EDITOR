import { useState, useCallback } from 'react'

export const usePreviewPagination = (
	onPageInfoChange?: (currentPage: number, totalPages: number) => void
) => {
	const [currentPageInfo, setCurrentPageInfo] = useState({ currentPage: 1, totalPages: 1 })

	// ページ情報更新ハンドラー
	const handleInternalPageInfoChange = useCallback(
		(currentPage: number, totalPages: number) => {
			setCurrentPageInfo({ currentPage, totalPages })
			// 外部にも通知
			onPageInfoChange?.(currentPage, totalPages)
		},
		[onPageInfoChange]
	)

	return {
		currentPageInfo,
		handleInternalPageInfoChange,
	}
}
