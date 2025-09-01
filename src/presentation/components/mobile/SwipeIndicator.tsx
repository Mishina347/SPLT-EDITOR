import React, { useEffect, useState } from 'react'
import { isMobile } from '@/utils/deviceDetection'
import styles from './SwipeIndicator.module.css'

interface SwipeIndicatorProps {
	showToolbar: boolean
	showPreview: boolean
	viewMode: string
}

export const SwipeIndicator: React.FC<SwipeIndicatorProps> = ({
	showToolbar,
	showPreview,
	viewMode,
}) => {
	const [showHint, setShowHint] = useState(false)
	const [hasShownHint, setHasShownHint] = useState(false)

	useEffect(() => {
		// モバイル端末でない場合は表示しない
		if (!isMobile()) return

		// 初回表示時にヒントを表示
		const hasSeenHint = localStorage.getItem('swipe-hint-shown')
		if (!hasSeenHint && !hasShownHint) {
			setShowHint(true)
			setHasShownHint(true)
			localStorage.setItem('swipe-hint-shown', 'true')

			// 3秒後にヒントを非表示
			setTimeout(() => {
				setShowHint(false)
			}, 3000)
		}
	}, [hasShownHint])

	// モバイル端末でない場合は何も表示しない
	if (!isMobile()) return null

	return (
		<>
			{/* スワイプヒント */}
			{showHint && (
				<div className={styles.swipeHint}>
					<div className={styles.hintContent}>
						<p>📱 スワイプ操作</p>
						<div className={styles.hintItem}>
							<span>上スワイプ</span>
							<span>ツールバー非表示</span>
						</div>
						<div className={styles.hintItem}>
							<span>下スワイプ</span>
							<span>ツールバー表示</span>
						</div>
						{viewMode === 'both' && (
							<>
								<div className={styles.hintItem}>
									<span>左スワイプ</span>
									<span>プレビュー非表示</span>
								</div>
								<div className={styles.hintItem}>
									<span>右スワイプ</span>
									<span>プレビュー表示</span>
								</div>
							</>
						)}
					</div>
				</div>
			)}
		</>
	)
}
