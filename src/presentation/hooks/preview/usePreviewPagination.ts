import { useState, useEffect, useMemo, useCallback } from 'react'
import { PaginationService } from '@/infra'
import { LayoutConfig } from '@/domain'

interface UsePreviewPaginationProps {
	text: string
	config: LayoutConfig
	onPageInfoChange: (currentPage: number, totalPages: number) => void
}

export const usePreviewPagination = ({
	text,
	config,
	onPageInfoChange,
}: UsePreviewPaginationProps) => {
	const [pageIndex, setPageIndex] = useState(0)

	// ページネーション処理を最適化（テキスト、レイアウト設定、フォント設定の変更時に再実行）
	const pages = useMemo(() => {
		// 空のテキストの場合は早期リターン
		if (!text || text.trim() === '') {
			return [['']]
		}

		// 設定が変更された場合のみページネーションを実行
		return PaginationService.paginate(text, config)
	}, [text, config])

	// ページ数が変わったら pageIndex をクランプ
	useEffect(() => {
		setPageIndex(p => {
			if (pages.length === 0) return 0
			if (p < 0) return 0
			if (p > pages.length - 1) return pages.length - 1
			return p
		})
	}, [pages])

	// ページ情報が変更されたら親に通知
	useEffect(() => {
		onPageInfoChange?.(pageIndex + 1, pages.length) // 1ベースでページ番号を渡す
	}, [pageIndex, pages.length, onPageInfoChange])

	const currentPage = pages[pageIndex] || []
	const notInitPage = pageIndex !== 0
	const notLastPage = pageIndex !== pages.length - 1

	// 古いAPIとの互換性のため
	const currentPageInfo = { currentPage: pageIndex + 1, totalPages: pages.length }
	const handleInternalPageInfoChange = useCallback(
		(currentPage: number, totalPages: number) => {
			onPageInfoChange?.(currentPage, totalPages)
		},
		[onPageInfoChange]
	)

	const goPrev = useCallback(() => {
		setPageIndex(Math.max(0, pageIndex - 1))
	}, [pageIndex])

	const goNext = useCallback(() => {
		setPageIndex(Math.min(pages.length - 1, pageIndex + 1))
	}, [pageIndex, pages])

	const goToFirst = useCallback(() => {
		setPageIndex(0)
	}, [])

	const goToLast = useCallback(() => {
		setPageIndex(pages.length - 1)
	}, [pages])

	const goToPage = useCallback(
		(targetPage: number) => {
			setPageIndex(Math.max(0, Math.min(targetPage, pages.length - 1)))
		},
		[pages]
	)

	return {
		// 状態
		pageIndex,
		pages,
		currentPage,
		notInitPage,
		notLastPage,

		// 古いAPIとの互換性
		currentPageInfo,
		handleInternalPageInfoChange,

		// ナビゲーション
		goPrev,
		goNext,
		goToFirst,
		goToLast,
		goToPage,
		setPageIndex,
	}
}
