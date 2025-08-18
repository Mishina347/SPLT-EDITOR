import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { LayoutConfig, PREVIEW_CONSTANTS } from '../../../../domain'
import { PaginationService } from '../../../../infra'
import styles from './Preview.module.css'

type Props = {
	text: string
	config: LayoutConfig
	isMaximized: boolean
	onFocusMode?: (isFocused: boolean) => void
	onPageInfoChange?: (currentPage: number, totalPages: number) => void
}

export function Preview({ text, config, isMaximized, onFocusMode, onPageInfoChange }: Props) {
	// ページネーション処理を最適化（テキストの変更が少ない場合のみ再実行）
	const pages = useMemo(() => {
		// 空のテキストの場合は早期リターン
		if (!text || text.trim() === '') {
			return [['']]
		}

		// 設定が変更された場合のみページネーションを実行
		return PaginationService.paginate(text, config)
	}, [text, config.charsPerLine, config.linesPerPage])

	const [pageIndex, setPageIndex] = useState(0)
	const [mousePosition, setMousePosition] = useState<'left' | 'right' | null>(null)
	const [isFocusMode, setIsFocusMode] = useState(false)

	// スワイプ検出用の状態
	const [touchStart, setTouchStart] = useState<{ x: number; y: number } | null>(null)
	const [touchEnd, setTouchEnd] = useState<{ x: number; y: number } | null>(null)
	const [isSwipping, setIsSwipping] = useState(false)

	// スワイプ検出の閾値
	const SWIPE_THRESHOLD = PREVIEW_CONSTANTS.SWIPE.THRESHOLD
	const VERTICAL_THRESHOLD = PREVIEW_CONSTANTS.SWIPE.VERTICAL_THRESHOLD

	const containerRef = useRef<HTMLDivElement>(null)
	const previewRef = useRef<HTMLDivElement>(null)

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
	}, [pageIndex, pages.length])

	// グローバルクリックイベントでフォーカスモード解除
	useEffect(() => {
		const handleGlobalClick = (event: MouseEvent) => {
			if (!isFocusMode) return

			// プレビューエリア外をクリックした場合のみフォーカスモード解除
			if (previewRef.current && !previewRef.current.contains(event.target as Node)) {
				setIsFocusMode(false)
				onFocusMode?.(false)
			}
		}

		if (isFocusMode) {
			document.addEventListener('click', handleGlobalClick, true)
		}

		return () => {
			document.removeEventListener('click', handleGlobalClick, true)
		}
	}, [isFocusMode, onFocusMode])

	const currentPage = pages[pageIndex] || []
	const notInitPage = pageIndex !== 0
	const notLastPage = pageIndex !== pages.length - 1

	const goPrev = useCallback(() => {
		setPageIndex(Math.max(0, pageIndex - 1))
	}, [pageIndex])

	const goNext = useCallback(() => {
		setPageIndex(Math.min(pages.length - 1, pageIndex + 1))
	}, [pageIndex, pages])

	// スワイプ処理
	const handleSwipe = useCallback(() => {
		if (!touchStart || !touchEnd) return

		const deltaX = touchEnd.x - touchStart.x
		const deltaY = Math.abs(touchEnd.y - touchStart.y)

		// 縦方向の移動が大きすぎる場合はスワイプとして認識しない
		if (deltaY > VERTICAL_THRESHOLD) return

		// 水平方向のスワイプを検出
		if (Math.abs(deltaX) > SWIPE_THRESHOLD) {
			if (deltaX > 0) {
				// 右スワイプ → 前のページ（日本語縦書きの場合）
				if (notInitPage) goPrev()
			} else {
				// 左スワイプ → 次のページ（日本語縦書きの場合）
				if (notLastPage) goNext()
			}
		}

		// リセット
		setTouchStart(null)
		setTouchEnd(null)
	}, [
		touchStart,
		touchEnd,
		notInitPage,
		notLastPage,
		goPrev,
		goNext,
		SWIPE_THRESHOLD,
		VERTICAL_THRESHOLD,
	])

	// スワイプ検出のuseEffect
	useEffect(() => {
		if (touchEnd !== null) {
			handleSwipe()
		}
	}, [touchEnd, handleSwipe])

	const handleMouseMove = useCallback(
		(e: React.MouseEvent) => {
			const rect = containerRef.current?.getBoundingClientRect()
			if (!rect) return
			const mouseX = e.clientX - rect.left
			const middle = rect.width / 2

			if (mouseX < middle) {
				setMousePosition('left')
			} else {
				setMousePosition('right')
			}
		},
		[containerRef]
	)

	const handleMouseLeave = useCallback(() => {
		setMousePosition(null)
	}, [])

	const handleClick = useCallback(
		(e: React.MouseEvent) => {
			e.stopPropagation()
			const rect = containerRef.current?.getBoundingClientRect()
			if (!rect) return
			const clickX = e.clientX - rect.left
			// container 内の X 座標
			const middle = rect.width / 2
			if (clickX < middle) {
				if (notLastPage) goNext()
				// 左側クリック → 1ページ進む
			} else {
				if (notInitPage) goPrev()
				// 右側クリック → 1ページ戻る
			}
		},
		[containerRef, goNext, goPrev, notInitPage, notLastPage]
	)

	const handlePageBaseClick = useCallback(
		(e: React.MouseEvent) => {
			if (isFocusMode) return
			const newFocusMode = !isFocusMode
			setIsFocusMode(newFocusMode)
			onFocusMode?.(newFocusMode)
		},
		[isFocusMode, onFocusMode]
	)

	// タッチイベントハンドラー
	const handleTouchStart = useCallback((e: React.TouchEvent) => {
		const touch = e.touches[0]
		setTouchStart({ x: touch.clientX, y: touch.clientY })
		setTouchEnd(null)
		setIsSwipping(true)
	}, [])

	const handleTouchMove = useCallback(
		(e: React.TouchEvent) => {
			if (!touchStart) return
			const touch = e.touches[0]
			setTouchEnd({ x: touch.clientX, y: touch.clientY })
		},
		[touchStart]
	)

	const handleTouchEnd = useCallback(() => {
		setIsSwipping(false)
		// touchEndの状態は既にhandleTouchMoveで設定されているので、
		// ここでは何もしない（useEffectでhandleSwipeが呼ばれる）
	}, [])

	return (
		<div
			ref={previewRef}
			style={{
				margin: '0.5rem',
				position: 'relative',
				background: 'var(--app-bg-color, #f0f0f0)',
				color: 'var(--app-text-color, #000000)',
				transition: 'background-color 0.3s ease, color 0.3s ease',
			}}
		>
			<div
				className={`${styles.previewContainer} ${isSwipping ? styles.swipping : ''}`}
				aria-label="縦書きプレビュー"
				ref={containerRef}
				onClick={e => handleClick(e)}
				onMouseMove={handleMouseMove}
				onMouseLeave={handleMouseLeave}
				onTouchStart={handleTouchStart}
				onTouchMove={handleTouchMove}
				onTouchEnd={handleTouchEnd}
			>
				{/* 左側のページめくりエフェクト */}
				<div
					className={`${notLastPage && styles.pageTurnLeft} ${mousePosition === 'left' ? styles.visible : ''}`}
				/>
				{/* 右側のページめくりエフェクト */}
				<div
					className={`${notInitPage && styles.pageTurnRight} ${mousePosition === 'right' ? styles.visible : ''}`}
				/>
				<section className={styles.pageBase} onClick={handlePageBaseClick}>
					<article
						className={`${isMaximized ? styles.fullPane : styles.halfPane}`}
						role="region"
						aria-label={`ページ ${pageIndex + 1} / ${pages.length}`}
					>
						<ol className={styles.lines} role="list">
							{currentPage.map((line, lineIndex) => (
								<li key={lineIndex} className={styles.verticalLine} aria-label={`行 ${lineIndex + 1}`}>
									{line.split('').map((char, charIndex) => (
										<span key={charIndex} className={styles.verticalChar}>
											{char}
										</span>
									))}
								</li>
							))}
						</ol>
					</article>
				</section>
			</div>
		</div>
	)
}
