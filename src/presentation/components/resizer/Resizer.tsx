import React, { useEffect } from 'react'
import styles from './Resizer.module.css'

interface ResizerProps {
	isDragging: boolean

	isKeyboardMode: boolean
	announceText: string
	size: number
	onMouseDown: (e: React.MouseEvent) => void
	onTouchStart: (e: React.TouchEvent) => void
	onTouchMove?: (e: React.TouchEvent) => void
	onTouchEnd?: (e: React.TouchEvent) => void
	onKeyDown: (e: React.KeyboardEvent) => void
	onFocus: () => void
	onBlur: () => void
	resizerRef: React.RefObject<HTMLDivElement>
}

export const Resizer: React.FC<ResizerProps> = ({
	isDragging,
	isKeyboardMode,
	announceText,
	size,
	onMouseDown,
	onTouchStart,
	onTouchMove,
	onTouchEnd,
	onKeyDown,
	onFocus,
	onBlur,
	resizerRef,
}) => {
	const getCurrentState = () => {
		if (isDragging) return 'ドラッグ中'
		if (isKeyboardMode) return 'キーボード操作中'
		return '待機中'
	}

	const getInstructions = () => {
		if (isKeyboardMode) {
			return '矢印キー: サイズ調整, Home/End: 最小/最大, PageUp/PageDown: 大幅調整, Esc: 終了'
		}
		return 'Enter: キーボード操作, 長押し: ドラッグ操作'
	}

	// ネイティブDOMイベントリスナーでpreventDefaultを確実に動作させる
	useEffect(() => {
		const element = resizerRef.current
		if (!element) return

		// タッチイベントをReact合成イベントに変換するヘルパー関数
		const createSyntheticEvent = (e: TouchEvent, type: string) =>
			({
				currentTarget: element,
				target: element,
				touches: e.touches,
				changedTouches: e.changedTouches,
				targetTouches: e.targetTouches,
				nativeEvent: e,
				preventDefault: () => e.preventDefault(),
				stopPropagation: () => e.stopPropagation(),
				isPropagationStopped: () => false,
				isDefaultPrevented: () => e.defaultPrevented,
				persist: () => {},
				getModifierState: () => false,
				altKey: false,
				ctrlKey: false,
				metaKey: false,
				shiftKey: false,
				bubbles: e.bubbles,
				cancelable: e.cancelable,
				defaultPrevented: e.defaultPrevented,
				eventPhase: e.eventPhase,
				isTrusted: e.isTrusted,
				timeStamp: e.timeStamp,
				type: type,
			}) as unknown as React.TouchEvent

		const handleNativeTouchStart = (e: TouchEvent) => {
			e.preventDefault() // ネイティブイベントなので確実にpreventDefaultが動作
			const syntheticEvent = createSyntheticEvent(e, 'touchstart')
			onTouchStart(syntheticEvent)
		}

		const handleNativeTouchMove = (e: TouchEvent) => {
			if (onTouchMove) {
				e.preventDefault()
				const syntheticEvent = createSyntheticEvent(e, 'touchmove')
				onTouchMove(syntheticEvent)
			}
		}

		const handleNativeTouchEnd = (e: TouchEvent) => {
			if (onTouchEnd) {
				e.preventDefault()
				const syntheticEvent = createSyntheticEvent(e, 'touchend')
				onTouchEnd(syntheticEvent)
			}
		}

		// メインのリサイザー要素とタッチエリアの両方にイベントリスナーを追加
		element.addEventListener('touchstart', handleNativeTouchStart, { passive: false })
		element.addEventListener('touchmove', handleNativeTouchMove, { passive: false })
		element.addEventListener('touchend', handleNativeTouchEnd, { passive: false })

		// タッチエリア要素も取得
		const touchArea = element.querySelector(`.${styles.touchArea}`) as HTMLElement
		if (touchArea) {
			touchArea.addEventListener('touchstart', handleNativeTouchStart, { passive: false })
			touchArea.addEventListener('touchmove', handleNativeTouchMove, { passive: false })
			touchArea.addEventListener('touchend', handleNativeTouchEnd, { passive: false })
		}

		return () => {
			element.removeEventListener('touchstart', handleNativeTouchStart)
			element.removeEventListener('touchmove', handleNativeTouchMove)
			element.removeEventListener('touchend', handleNativeTouchEnd)
			if (touchArea) {
				touchArea.removeEventListener('touchstart', handleNativeTouchStart)
				touchArea.removeEventListener('touchmove', handleNativeTouchMove)
				touchArea.removeEventListener('touchend', handleNativeTouchEnd)
			}
		}
	}, [onTouchStart, onTouchMove, onTouchEnd])

	return (
		<>
			{/* スクリーンリーダー向けライブリージョン */}
			<div
				id="resizer-live-region"
				aria-live="assertive"
				aria-atomic="true"
				className={styles['sr-only']}
			>
				{announceText}
			</div>

			{/* 操作説明（スクリーンリーダー向け） */}
			<div id="resizer-instructions" className={styles['sr-only']}>
				{getInstructions()}
			</div>

			{/* 現在の状態（スクリーンリーダー向け） */}
			<div id="resizer-state" className={styles['sr-only']}>
				現在の状態: {getCurrentState()}, エディタ {Math.round(size)}%, プレビュー{' '}
				{Math.round(100 - size)}%
			</div>

			<div
				ref={resizerRef}
				tabIndex={0}
				className={`${styles.resizer} ${isDragging ? styles.dragging : ''} ${
					isKeyboardMode ? styles.keyboardMode : ''
				}`}
				onMouseDown={onMouseDown}
				onKeyDown={onKeyDown}
				onFocus={onFocus}
				onBlur={onBlur}
				role="separator"
				aria-label="エディタとプレビューのサイズ調整"
				aria-orientation="vertical"
				aria-valuemin={20}
				aria-valuemax={80}
				aria-valuenow={Math.round(size)}
				aria-valuetext={`エディタ ${Math.round(size)}%, プレビュー ${Math.round(100 - size)}%`}
				aria-describedby="resizer-instructions resizer-state"
				aria-expanded={isKeyboardMode}
				data-testid="panel-resizer"
			>
				{/* 拡張されたタッチエリア（44px幅） */}
				<div className={styles.touchArea} onMouseDown={onMouseDown} aria-hidden="true" />

				<div className={styles.handle}>
					<div className={styles.grip} aria-hidden="true">
						<span></span>
						<span></span>
						<span></span>
					</div>

					{/* 状態表示 */}
					<div className={styles.statusContainer}>
						{isKeyboardMode && (
							<div className={styles.hint} aria-hidden="true">
								キーボード操作中
							</div>
						)}
					</div>

					{/* キーボードモード時の追加UI */}
					{isKeyboardMode && (
						<div className={styles.keyboardIndicator} aria-hidden="true">
							<div className={styles.sizeDisplay}>{Math.round(size)}%</div>
							<div className={styles.keyboardHints}>
								<span>←→ 調整</span>
								<span>Esc 終了</span>
							</div>
						</div>
					)}
				</div>
			</div>
		</>
	)
}
