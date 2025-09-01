import { useRef, useMemo, useEffect } from 'react'
import { usePreviewPagination } from './usePreviewPagination'
import { usePreviewSwipe } from './usePreviewSwipe'
import { usePreviewKeyboard } from './usePreviewKeyboard'
import { usePreviewMouse } from './usePreviewMouse'
import { usePreviewFocusMode } from './usePreviewFocusMode'
import { LayoutConfig } from '@/domain'
import { usePerformanceOptimization } from '../common'
import { PaginationService } from '@/infra'

interface UsePreviewProps {
	text: string
	config: LayoutConfig
	isMaximized: boolean
	onFocusMode: (focused: boolean) => void
	onPageInfoChange: (currentPage: number, totalPages: number) => void
}

export const usePreview = ({ text, config, onFocusMode, onPageInfoChange }: UsePreviewProps) => {
	const containerRef = useRef<HTMLDivElement>(null)
	const previewRef = useRef<HTMLDivElement>(null)

	// パフォーマンス最適化フック
	const { debounce } = usePerformanceOptimization()

	// ページネーション管理
	const {
		pageIndex,
		pages,
		currentPage,
		notInitPage,
		notLastPage,
		goPrev,
		goNext,
		goToFirst,
		goToLast,
		goToPage,
	} = usePreviewPagination({
		text,
		config,
		onPageInfoChange: (currentPage, totalPages) => {
			// ページ情報の変更を親に通知
			onPageInfoChange?.(currentPage, totalPages)
		},
	})

	// フォーカスモード管理
	const { isFocusMode, handlePageBaseClick, handleFocusModeChange, setIsFocusMode } =
		usePreviewFocusMode({
			previewRef,
			onFocusMode,
		})

	// スワイプ処理
	const { isSwipping, handleTouchStart, handleTouchMove, handleTouchEnd } = usePreviewSwipe({
		notInitPage,
		notLastPage,
		onPrev: goPrev,
		onNext: goNext,
	})

	// キーボードナビゲーション
	const { handleKeyDown } = usePreviewKeyboard({
		pageIndex,
		pagesLength: pages.length,
		notInitPage,
		notLastPage,
		isFocusMode,
		onPrev: goPrev,
		onNext: goNext,
		onGoToFirst: goToFirst,
		onGoToLast: goToLast,
		onGoToPage: goToPage,
		onFocusModeChange: handleFocusModeChange,
	})

	// マウス操作
	const { mousePosition, handleMouseMove, handleMouseLeave, handleClick } = usePreviewMouse({
		containerRef,
		notInitPage,
		notLastPage,
		onPrev: goPrev,
		onNext: goNext,
	})

	// フォント設定変更時のキャッシュクリアと強制再描画（最適化版）
	const debouncedFontUpdate = useMemo(
		() =>
			debounce(() => {
				console.log('[Preview] Font settings changed:', {
					fontSize: config.fontSize,
					fontFamily: config.fontFamily,
				})

				// フォント設定が変更されたらページネーションキャッシュをクリア
				PaginationService.clearCacheForFontChange()

				// CSSカスタムプロパティを更新
				if (containerRef.current) {
					const container = containerRef.current
					container.style.setProperty('--preview-font-family', config.fontFamily)
				}

				// 強制再描画をトリガー
				if (containerRef.current) {
					// DOM要素を強制的に再描画
					const container = containerRef.current
					container.style.display = 'none'
					// 強制的にリフローを発生させる
					container.offsetHeight
					container.style.display = ''
				}
			}, 200),
		[debounce, config.fontSize, config.fontFamily]
	)

	useEffect(() => {
		debouncedFontUpdate()
	}, [debouncedFontUpdate])

	// 設定オブジェクト全体の変更を監視（フォールバック）
	useEffect(() => {
		// 設定が変更されたらページネーションキャッシュをクリア
		PaginationService.clearCacheForFontChange()
	}, [config])

	return {
		// refs
		containerRef,
		previewRef,

		// 状態
		pageIndex,
		pages,
		currentPage,
		notInitPage,
		notLastPage,
		isFocusMode,
		isSwipping,
		mousePosition,

		// ハンドラー
		handleKeyDown,
		handleMouseMove,
		handleMouseLeave,
		handleClick,
		handlePageBaseClick,
		handleTouchStart,
		handleTouchMove,
		handleTouchEnd,
		handleFocusModeChange,
		setIsFocusMode,
	}
}
