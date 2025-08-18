import React, { ReactNode, useCallback, useEffect, useState, useRef } from 'react'
import { useDraggableResize, ResizeDirection } from '../../hooks/useDraggableResize'
import { usePinchZoom } from '../../hooks/usePinchZoom'
import { ResizeHandle } from './ResizeHandle'
import { UI_CONSTANTS } from '../../../utils'
import styles from './DraggableContainer.module.css'

// ネイティブTouchからReact.Touchへの変換型定義
interface ReactTouchEvent extends Partial<React.TouchEvent> {
	touches: React.TouchList
	changedTouches?: React.TouchList
	targetTouches?: React.TouchList
	preventDefault: () => void
	stopPropagation: () => void
}

// ネイティブTouchからReact.MouseEventへの変換型定義
interface ReactMouseEventFromTouch extends Partial<React.MouseEvent> {
	clientX: number
	clientY: number
	touches: TouchList
	preventDefault: () => void
	stopPropagation: () => void
}

// TouchListの変換ヘルパー関数
const convertToReactTouchList = (nativeTouchList: TouchList): React.TouchList => {
	const touchArray = Array.from(nativeTouchList)
	return touchArray as unknown as React.TouchList
}

interface DraggableContainerProps {
	children: ReactNode
	title?: string
	initialPosition?: { x: number; y: number }
	initialSize?: { width: number; height: number }
	minSize?: { width: number; height: number }
	maxSize?: { width: number; height: number }
	resizable?: boolean
	draggable?: boolean
	isMaximized?: boolean
	className?: string
	zIndex?: number
	onPositionChange?: (position: { x: number; y: number }) => void
	onSizeChange?: (size: { width: number; height: number }) => void
	onFocus?: () => void
	// ピンチズーム関連
	enablePinchZoom?: boolean
	initialScale?: number
	minScale?: number
	maxScale?: number
	onScaleChange?: (scale: number) => void
	// カスタムヘッダー関連
	customHeader?: ReactNode
	showDefaultHeader?: boolean
}

const RESIZE_DIRECTIONS: ResizeDirection[] = ['n', 's', 'e', 'w', 'ne', 'nw', 'se', 'sw']

export const DraggableContainer: React.FC<DraggableContainerProps> = ({
	children,
	title,
	initialPosition = UI_CONSTANTS.DRAGGABLE_CONTAINER.DEFAULT_POSITION,
	initialSize = UI_CONSTANTS.DRAGGABLE_CONTAINER.DEFAULT_SIZE,
	minSize = UI_CONSTANTS.DRAGGABLE_CONTAINER.MIN_SIZE,
	maxSize = UI_CONSTANTS.DRAGGABLE_CONTAINER.MAX_SIZE,
	resizable = true,
	draggable = true,
	isMaximized = false,
	className = '',
	zIndex,
	onPositionChange,
	onSizeChange,
	onFocus,
	// ピンチズーム関連
	enablePinchZoom = true,
	initialScale = 1,
	minScale = 0.5,
	maxScale = 3,
	onScaleChange,
	// カスタムヘッダー関連
	customHeader,
	showDefaultHeader = true,
}) => {
	// 内部要素にフォーカスが当たっているかの状態管理
	const [isContentFocused, setIsContentFocused] = useState(false)
	const contentRef = useRef<HTMLDivElement>(null)

	const { state, handlers, elementRef, handleKeyDown } = useDraggableResize({
		initialPosition,
		initialSize,
		minSize,
		maxSize,
		constrainToParent: false, // 親要素制限を無効にして画面全体を使用
		allowOutsideViewport: true,
		onDrag: onPositionChange,
		onResize: onSizeChange,
		onDragStart: onFocus,
		onDragEnd: onFocus,
		onResizeStart: onFocus,
		onResizeEnd: onFocus,
	})

	// ピンチズーム機能
	const pinchZoom = usePinchZoom({
		initialScale,
		minScale,
		maxScale,
		onScaleChange,
	})

	// ネイティブタッチイベントハンドラー（passive: false対応）
	const handleNativeTouchStart = useCallback(
		(e: Event) => {
			const touchEvent = e as TouchEvent
			const target = touchEvent.target as HTMLElement

			// コンテンツエリア内でのタッチイベントかチェック
			const isContentAreaTouch = contentRef.current && contentRef.current.contains(target)

			if (enablePinchZoom && touchEvent.touches.length === 2) {
				// 2点タッチの場合はピンチズーム
				touchEvent.preventDefault() // passive: falseで確実に実行
				// React.TouchEventに変換
				const reactEvent: ReactTouchEvent = {
					touches: convertToReactTouchList(touchEvent.touches),
					changedTouches: convertToReactTouchList(touchEvent.changedTouches),
					targetTouches: convertToReactTouchList(touchEvent.targetTouches),
					preventDefault: () => touchEvent.preventDefault(),
					stopPropagation: () => touchEvent.stopPropagation(),
				}
				pinchZoom.handlers.onTouchStart(reactEvent as React.TouchEvent)
			} else if (touchEvent.touches.length === 1 && draggable && !isContentAreaTouch) {
				// 1点タッチの場合はドラッグ（コンテンツエリア外のみ）
				touchEvent.preventDefault() // passive: falseで確実に実行
				// React.MouseEventに変換
				const touch = touchEvent.touches[0]
				const reactEvent: ReactMouseEventFromTouch = {
					clientX: touch.clientX,
					clientY: touch.clientY,
					touches: touchEvent.touches,
					preventDefault: () => touchEvent.preventDefault(),
					stopPropagation: () => touchEvent.stopPropagation(),
				}
				handlers.onMouseDown(reactEvent as React.MouseEvent | React.TouchEvent)
			}
		},
		[enablePinchZoom, draggable, pinchZoom.handlers, handlers, contentRef]
	)

	const handleNativeTouchMove = useCallback(
		(e: Event) => {
			const touchEvent = e as TouchEvent
			if (enablePinchZoom && touchEvent.touches.length === 2) {
				touchEvent.preventDefault() // ピンチ時のスクロール防止
				// React.TouchEventに変換
				const reactEvent: ReactTouchEvent = {
					touches: convertToReactTouchList(touchEvent.touches),
					changedTouches: convertToReactTouchList(touchEvent.changedTouches),
					targetTouches: convertToReactTouchList(touchEvent.targetTouches),
					preventDefault: () => touchEvent.preventDefault(),
					stopPropagation: () => touchEvent.stopPropagation(),
				}
				pinchZoom.handlers.onTouchMove(reactEvent as React.TouchEvent)
			}
		},
		[enablePinchZoom, pinchZoom.handlers]
	)

	const handleNativeTouchEnd = useCallback(
		(e: Event) => {
			const touchEvent = e as TouchEvent
			if (enablePinchZoom) {
				// React.TouchEventに変換
				const reactEvent: ReactTouchEvent = {
					touches: convertToReactTouchList(touchEvent.touches),
					changedTouches: convertToReactTouchList(touchEvent.changedTouches),
					targetTouches: convertToReactTouchList(touchEvent.targetTouches),
					preventDefault: () => touchEvent.preventDefault(),
					stopPropagation: () => touchEvent.stopPropagation(),
				}
				pinchZoom.handlers.onTouchEnd(reactEvent as React.TouchEvent)
			}
		},
		[enablePinchZoom, pinchZoom.handlers]
	)

	// 内部要素のフォーカス状態を監視
	useEffect(() => {
		const contentElement = contentRef.current
		if (!contentElement) return

		const handleFocusIn = (event: FocusEvent) => {
			// フォーカスがコンテンツエリア内の要素に移った場合
			if (contentElement.contains(event.target as Node)) {
				setIsContentFocused(true)
			}
		}

		const handleFocusOut = (event: FocusEvent) => {
			// フォーカスがコンテンツエリア外に移った場合
			// relatedTargetがnullの場合や、コンテンツエリア外の場合にフォーカス状態を解除
			if (!event.relatedTarget || !contentElement.contains(event.relatedTarget as Node)) {
				setIsContentFocused(false)
			}
		}

		contentElement.addEventListener('focusin', handleFocusIn)
		contentElement.addEventListener('focusout', handleFocusOut)

		return () => {
			contentElement.removeEventListener('focusin', handleFocusIn)
			contentElement.removeEventListener('focusout', handleFocusOut)
		}
	}, [])

	// ネイティブタッチイベントリスナーの設定
	useEffect(() => {
		const element = elementRef.current
		if (!element) return

		// passive: false を明示的に設定（ピンチズーム用）
		element.addEventListener('touchstart', handleNativeTouchStart, { passive: false })
		element.addEventListener('touchmove', handleNativeTouchMove, { passive: false })
		element.addEventListener('touchend', handleNativeTouchEnd, { passive: false })

		return () => {
			element.removeEventListener('touchstart', handleNativeTouchStart)
			element.removeEventListener('touchmove', handleNativeTouchMove)
			element.removeEventListener('touchend', handleNativeTouchEnd)
		}
	}, [handleNativeTouchStart, handleNativeTouchMove, handleNativeTouchEnd])

	return (
		<div
			ref={elementRef}
			className={`${styles.draggableContainer} ${isMaximized ? styles.maximized : ''} ${isContentFocused ? styles.contentFocused : ''} ${className}`}
			style={{
				position: 'absolute',
				left: state.position.x,
				top: state.position.y,
				width: state.size.width,
				height: state.size.height,
				zIndex: (() => {
					// ドラッグ・リサイズ中は最優先
					if (state.isDragging || state.isResizing) {
						return 1000
					}
					// 最大化モードは高優先度
					if (isMaximized) {
						return 500
					}
					// プロパティで指定されたz-indexを使用
					if (zIndex !== undefined) {
						return zIndex
					}
					// デフォルト
					return 50
				})(),
				transform: enablePinchZoom ? `scale(${pinchZoom.state.scale})` : undefined,
				transformOrigin: 'center center',
				transition: pinchZoom.state.isPinching ? 'none' : 'transform 0.2s ease-out',
			}}
			data-dragging={state.isDragging}
			data-resizing={state.isResizing}
			data-pinching={pinchZoom.state.isPinching}
			onKeyDown={handleKeyDown}
			onClick={onFocus} // クリックでフォーカス
			tabIndex={0}
			role="dialog"
			aria-label={title || 'ドラッグ可能なコンテナ'}
			aria-describedby="drag-instructions"
		>
			{/* ドラッグハンドル（タイトルバーまたはカスタムヘッダー） */}
			{draggable && (
				<div
					className={styles.dragHandle}
					onMouseDown={customHeader ? undefined : handlers.onMouseDown}
					role="button"
					tabIndex={0}
					aria-label="ドラッグハンドル"
					style={{ cursor: state.isDragging ? 'grabbing' : customHeader ? 'auto' : 'grab' }}
					onKeyDown={e => {
						if (e.key === 'Enter' || e.key === ' ') {
							e.preventDefault()
							// キーボードでのドラッグモード切替
						}
					}}
				>
					{customHeader ? (
						<div className={styles.splitHeaderContainer}>
							<div className={styles.tabArea}>{customHeader}</div>
							<div
								className={styles.dragArea}
								onMouseDown={handlers.onMouseDown}
								style={{ cursor: state.isDragging ? 'grabbing' : 'grab' }}
								aria-label="ドラッグ"
							>
								<div className={styles.dragIcon}>⋮⋮</div>
							</div>
						</div>
					) : showDefaultHeader ? (
						<>
							{title && <span className={styles.title}>{title}</span>}
							<div
								className={styles.dragIcon}
								onMouseDown={handlers.onMouseDown}
								style={{ cursor: state.isDragging ? 'grabbing' : 'grab' }}
							>
								⋮⋮
							</div>
						</>
					) : null}
				</div>
			)}

			{/* コンテンツエリア */}
			<div ref={contentRef} className={styles.content}>
				{children}
			</div>

			{/* リサイズハンドル */}
			{resizable &&
				RESIZE_DIRECTIONS.map(direction => (
					<ResizeHandle
						key={direction}
						direction={direction}
						onMouseDown={handlers.onResizeMouseDown}
						visible={!state.isDragging}
					/>
				))}

			{/* アクセシビリティのための説明 */}
			<div id="drag-instructions" className={styles.srOnly}>
				Ctrl+矢印キーで移動、Ctrl+Alt+矢印キーでリサイズできます。
			</div>
		</div>
	)
}
