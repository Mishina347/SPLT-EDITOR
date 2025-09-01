import React from 'react'
import { usePreview } from '../../../hooks'
import { LayoutConfig } from '../../../../domain'
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
		// すべてのロジックを統合したhook
		const {
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
		} = usePreview({
			text,
			config,
			isMaximized,
			onFocusMode,
			onPageInfoChange,
		})

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
					onClick={handleClick}
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
