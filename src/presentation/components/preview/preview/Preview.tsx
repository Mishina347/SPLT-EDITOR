import React, { useEffect, useMemo, useRef, useState } from 'react'
import { PaginationService } from '../../../../infra/PaginationService'
import { LayoutConfig, PREVIEW_CONSTANTS } from '../../../../domain'
import styles from './Preview.module.css'

interface Props {
	text: string
	config: LayoutConfig
	isMaximized: boolean
	onFocusMode: (focused: boolean) => void
	onPageInfoChange: (currentPage: number, totalPages: number) => void
}

export const Preview = React.memo<Props>(
	({ text, config, isMaximized, onFocusMode, onPageInfoChange }) => {
		// ページネーション処理を最適化（テキスト、レイアウト設定、フォント設定の変更時に再実行）
		const pages = useMemo(() => {
			// 空のテキストの場合は早期リターン
			if (!text || text.trim() === '') {
				return [['']]
			}

			// 設定が変更された場合のみページネーションを実行
			return PaginationService.paginate(text, config)
		}, [text, config])

		// フォント設定変更時のキャッシュクリアと強制再描画（デバウンス処理付き）
		const fontChangeTimeoutRef = useRef<NodeJS.Timeout>()
		useEffect(() => {
			console.log('[Preview] Font settings changed:', {
				fontSize: config.fontSize,
				fontFamily: config.fontFamily,
			})

			// デバウンス処理でパフォーマンスを最適化
			if (fontChangeTimeoutRef.current) {
				clearTimeout(fontChangeTimeoutRef.current)
			}

			fontChangeTimeoutRef.current = setTimeout(() => {
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
			}, 200) // 200msのデバウンス

			return () => {
				if (fontChangeTimeoutRef.current) {
					clearTimeout(fontChangeTimeoutRef.current)
				}
			}
		}, [config.fontSize, config.fontFamily])

		// 設定オブジェクト全体の変更を監視（フォールバック）
		useEffect(() => {
			// 設定が変更されたらページネーションキャッシュをクリア
			PaginationService.clearCacheForFontChange()
		}, [config])

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

		// フォント設定が変更されたら強制再描画

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

		const goPrev = React.useCallback(() => {
			setPageIndex(Math.max(0, pageIndex - 1))
		}, [pageIndex])

		const goNext = React.useCallback(() => {
			setPageIndex(Math.min(pages.length - 1, pageIndex + 1))
		}, [pageIndex, pages])

		// スワイプ処理
		const handleSwipe = React.useCallback(() => {
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

		// キーボードイベントハンドラー
		const handleKeyDown = React.useCallback(
			(e: React.KeyboardEvent) => {
				// プレビューエリアにフォーカスがある時のみ処理
				if (e.currentTarget !== e.target) return

				let handled = false

				switch (e.key) {
					case 'ArrowLeft':
					case 'ArrowUp':
						// 左矢印・上矢印 → 次のページ（縦書きレイアウトでは左が次）
						if (notLastPage) {
							goNext()
							handled = true
						}
						break
					case 'ArrowRight':
					case 'ArrowDown':
						// 右矢印・下矢印 → 前のページ（縦書きレイアウトでは右が前）
						if (notInitPage) {
							goPrev()
							handled = true
						}
						break
					case 'Home':
						// Homeキー → 最初のページ
						if (pageIndex !== 0) {
							setPageIndex(0)
							handled = true
						}
						break
					case 'End':
						// Endキー → 最後のページ
						if (pageIndex !== pages.length - 1) {
							setPageIndex(pages.length - 1)
							handled = true
						}
						break
					case 'PageUp':
						// PageUpキー → 前のページ（複数ページ戻る）
						if (notInitPage) {
							setPageIndex(Math.max(0, pageIndex - 5))
							handled = true
						}
						break
					case 'PageDown':
						// PageDownキー → 次のページ（複数ページ進む）
						if (notLastPage) {
							setPageIndex(Math.min(pages.length - 1, pageIndex + 5))
							handled = true
						}
						break
					case 'Escape':
						// Escapeキー → フォーカスモード解除
						if (isFocusMode) {
							setIsFocusMode(false)
							onFocusMode?.(false)
							handled = true
						}
						break
				}

				if (handled) {
					e.preventDefault()
					e.stopPropagation()
				}
			},
			[pageIndex, pages.length, notInitPage, notLastPage, goPrev, goNext, isFocusMode, onFocusMode]
		)

		// スワイプ検出のuseEffect
		useEffect(() => {
			if (touchEnd !== null) {
				handleSwipe()
			}
		}, [touchEnd, handleSwipe])

		const handleMouseMove = React.useCallback(
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

		const handleMouseLeave = React.useCallback(() => {
			setMousePosition(null)
		}, [])

		const handleClick = React.useCallback(
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

		const handlePageBaseClick = React.useCallback(
			(e: React.MouseEvent) => {
				if (isFocusMode) return
				const newFocusMode = !isFocusMode
				setIsFocusMode(newFocusMode)
				onFocusMode?.(newFocusMode)
			},
			[isFocusMode, onFocusMode]
		)

		// タッチイベントハンドラー
		const handleTouchStart = React.useCallback((e: React.TouchEvent) => {
			const touch = e.touches[0]
			setTouchStart({ x: touch.clientX, y: touch.clientY })
			setTouchEnd(null)
			setIsSwipping(true)
		}, [])

		const handleTouchMove = React.useCallback(
			(e: React.TouchEvent) => {
				if (!touchStart) return
				const touch = e.touches[0]
				setTouchEnd({ x: touch.clientX, y: touch.clientY })
			},
			[touchStart]
		)

		const handleTouchEnd = React.useCallback(() => {
			setIsSwipping(false)
			// touchEndの状態は既にhandleTouchMoveで設定されているので、
			// ここでは何もしない（useEffectでhandleSwipeが呼ばれる）
		}, [])

		return (
			<main
				ref={previewRef}
				style={{
					margin: '0.5rem',
					position: 'relative',
					background: 'var(--app-bg-color, #f0f0f0)',
					color: 'var(--app-text-color, #000000)',
					transition: 'background-color 0.3s ease, color 0.3s ease',
				}}
			>
				<h2 className="sr-only">プレビュー</h2>
				{/* スクリーンリーダー向け操作説明 */}
				<div id="preview-instructions" className="sr-only">
					キーボード操作:
					左矢印・上矢印で次のページ、右矢印・下矢印で前のページ、Homeで最初のページ、Endで最後のページ、PageUp/PageDownで5ページずつ移動、Escapeでフォーカス解除
				</div>
				<section
					className={`${styles.previewContainer} ${isSwipping ? styles.swipping : ''}`}
					aria-label={`プレビュー: ページ ${pageIndex + 1} / ${pages.length}。矢印キーでページめくり、Escapeキーでフォーカス解除`}
					aria-describedby="preview-instructions"
					ref={containerRef}
					tabIndex={0}
					onClick={e => handleClick(e)}
					onMouseMove={handleMouseMove}
					onMouseLeave={handleMouseLeave}
					onTouchStart={handleTouchStart}
					onTouchMove={handleTouchMove}
					onTouchEnd={handleTouchEnd}
					onKeyDown={handleKeyDown}
					style={{
						fontSize: `${config.fontSize}px`,
						fontFamily: config.fontFamily,
					}}
				>
					{/* 左側のページめくりエフェクト */}
					<div
						className={`${notLastPage && styles.pageTurnLeft} ${mousePosition === 'left' ? styles.visible : ''}`}
					/>
					{/* 右側のページめくりエフェクト */}
					<div
						className={`${notInitPage && styles.pageTurnRight} ${mousePosition === 'right' ? styles.visible : ''}`}
					/>
					<article className={styles.pageBase} onClick={handlePageBaseClick}>
						<section
							className={`${isMaximized ? styles.fullPane : styles.halfPane}`}
							role="region"
							aria-label={`ページ ${pageIndex + 1} / ${pages.length}`}
						>
							{currentPage.length === 1 && currentPage[0] === '' ? (
								<div className={styles.emptyPreview}>
									<p>ここにプレビューが表示されます</p>
									<p>左側のエディタでテキストを入力してください</p>
								</div>
							) : (
								<div className={styles.lines} role="text">
									{currentPage.map((line, lineIndex) => (
										<section
											key={lineIndex}
											className={styles.verticalLine}
											aria-label={`行 ${lineIndex + 1}`}
										>
											{line.split('').map((char, charIndex) => (
												<p key={charIndex} className={styles.verticalChar}>
													{char}
												</p>
											))}
										</section>
									))}
								</div>
							)}
						</section>
					</article>
				</section>
			</main>
		)
	}
)
