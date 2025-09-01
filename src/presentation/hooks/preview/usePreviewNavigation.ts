import { useState, useCallback, useEffect, useMemo } from 'react'
import { PREVIEW_CONSTANTS, LayoutConfig } from '@/domain'
import { PaginationService } from '@/infra'

interface UsePreviewNavigationProps {
	text: string
	config: LayoutConfig
	onPageInfoChange?: (currentPage: number, totalPages: number) => void
}

interface SwipeState {
	touchStart: { x: number; y: number } | null
	touchEnd: { x: number; y: number } | null
	isSwipping: boolean
}

export const usePreviewNavigation = ({
	text,
	config,
	onPageInfoChange,
}: UsePreviewNavigationProps) => {
	// ページネーション処理を最適化
	const pages = useMemo(() => {
		if (!text || text.trim() === '') {
			return [['']]
		}
		return PaginationService.paginate(text, config)
	}, [text, config.charsPerLine, config.linesPerPage])

	const [pageIndex, setPageIndex] = useState(0)
	const [swipeState, setSwipeState] = useState<SwipeState>({
		touchStart: null,
		touchEnd: null,
		isSwipping: false,
	})

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
		onPageInfoChange?.(pageIndex + 1, pages.length)
	}, [pageIndex, pages.length, onPageInfoChange])

	// ページナビゲーション
	const goPrev = useCallback(() => {
		setPageIndex(prev => Math.max(0, prev - 1))
	}, [])

	const goNext = useCallback(() => {
		setPageIndex(prev => Math.min(pages.length - 1, prev + 1))
	}, [pages.length])

	// スワイプハンドリング
	const handleSwipe = useCallback(() => {
		if (!swipeState.touchStart || !swipeState.touchEnd) return

		const deltaX = swipeState.touchEnd.x - swipeState.touchStart.x
		const deltaY = Math.abs(swipeState.touchEnd.y - swipeState.touchStart.y)

		const SWIPE_THRESHOLD = PREVIEW_CONSTANTS.SWIPE.THRESHOLD
		const VERTICAL_THRESHOLD = PREVIEW_CONSTANTS.SWIPE.VERTICAL_THRESHOLD

		// 縦方向の移動が大きすぎる場合はスワイプとして認識しない
		if (deltaY > VERTICAL_THRESHOLD) return

		// 水平方向のスワイプを検出
		if (Math.abs(deltaX) > SWIPE_THRESHOLD) {
			if (deltaX > 0) {
				// 右スワイプ → 前のページ（日本語縦書きの場合）
				if (pageIndex > 0) goPrev()
			} else {
				// 左スワイプ → 次のページ（日本語縦書きの場合）
				if (pageIndex < pages.length - 1) goNext()
			}
		}

		// リセット
		setSwipeState({
			touchStart: null,
			touchEnd: null,
			isSwipping: false,
		})
	}, [swipeState.touchStart, swipeState.touchEnd, pageIndex, pages.length, goPrev, goNext])

	// スワイプ検出のuseEffect
	useEffect(() => {
		if (swipeState.touchEnd !== null) {
			handleSwipe()
		}
	}, [swipeState.touchEnd, handleSwipe])

	// タッチイベントハンドラー
	const handleTouchStart = useCallback((e: React.TouchEvent) => {
		const touch = e.touches[0]
		setSwipeState(prev => ({
			...prev,
			touchStart: { x: touch.clientX, y: touch.clientY },
			touchEnd: null,
			isSwipping: true,
		}))
	}, [])

	const handleTouchMove = useCallback(
		(e: React.TouchEvent) => {
			if (!swipeState.touchStart) return
			const touch = e.touches[0]
			setSwipeState(prev => ({
				...prev,
				touchEnd: { x: touch.clientX, y: touch.clientY },
			}))
		},
		[swipeState.touchStart]
	)

	const handleTouchEnd = useCallback(() => {
		setSwipeState(prev => ({
			...prev,
			isSwipping: false,
		}))
	}, [])

	// マウスイベントでのページ切り替え
	const handlePageClick = useCallback(
		(clickX: number, containerWidth: number) => {
			const middle = containerWidth / 2
			if (clickX < middle) {
				if (pageIndex < pages.length - 1) goNext()
			} else {
				if (pageIndex > 0) goPrev()
			}
		},
		[pageIndex, pages.length, goNext, goPrev]
	)

	const currentPage = pages[pageIndex] || []
	const notInitPage = pageIndex !== 0
	const notLastPage = pageIndex !== pages.length - 1

	return {
		// データ
		pages,
		currentPage,
		pageIndex,
		totalPages: pages.length,

		// 状態
		isSwipping: swipeState.isSwipping,
		notInitPage,
		notLastPage,

		// アクション
		goPrev,
		goNext,
		handlePageClick,

		// タッチイベント
		handleTouchStart,
		handleTouchMove,
		handleTouchEnd,
	}
}
