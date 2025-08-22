import { useCallback, useRef, useState, useEffect } from 'react'
import { calculateElementScale, calculateScaleWithViewport } from '../../utils/scaleCalculator'

export interface DraggableResizeState {
	position: { x: number; y: number }
	size: { width: number; height: number }
	isDragging: boolean
	isResizing: boolean
}

export interface DraggableResizeHandlers {
	onMouseDown: (e: React.MouseEvent | React.TouchEvent) => void
	onResizeMouseDown: (e: React.MouseEvent | React.TouchEvent, direction: ResizeDirection) => void
}

export type ResizeDirection = 'n' | 's' | 'e' | 'w' | 'ne' | 'nw' | 'se' | 'sw'

interface UseDraggableResizeOptions {
	initialPosition?: { x: number; y: number }
	initialSize?: { width: number; height: number }
	minSize?: { width: number; height: number }
	maxSize?: { width: number; height: number }
	constrainToParent?: boolean
	allowOutsideViewport?: boolean
	onDrag?: (position: { x: number; y: number }) => void
	onResize?: (size: { width: number; height: number }) => void
	onDragStart?: () => void
	onDragEnd?: () => void
	onResizeStart?: () => void
	onResizeEnd?: () => void
}

export const useDraggableResize = (options: UseDraggableResizeOptions = {}) => {
	const {
		initialPosition = { x: 0, y: 0 },
		initialSize = { width: 300, height: 200 },
		minSize = { width: 100, height: 100 },
		maxSize = { width: 1200, height: 1000 },
		constrainToParent = false, // デフォルトを false に変更
		allowOutsideViewport = true, // ビューポート外も許可
		onDrag,
		onResize,
		onDragStart,
		onDragEnd,
		onResizeStart,
		onResizeEnd,
	} = options

	const [state, setState] = useState<DraggableResizeState>({
		position: initialPosition,
		size: initialSize,
		isDragging: false,
		isResizing: false,
	})

	// initialPositionが変更された時に状態を更新（ドラッグ中でない時のみ）
	useEffect(() => {
		setState(prev => {
			// ドラッグ中やリサイズ中は初期値の変更を無視
			if (prev.isDragging || prev.isResizing) {
				return prev
			}
			return {
				...prev,
				position: initialPosition,
				size: initialSize,
			}
		})
	}, [initialPosition.x, initialPosition.y, initialSize.width, initialSize.height])

	const dragStartPos = useRef<{ x: number; y: number }>({ x: 0, y: 0 })
	const dragStartElementPos = useRef<{ x: number; y: number }>({ x: 0, y: 0 })
	const resizeStartPos = useRef<{ x: number; y: number }>({ x: 0, y: 0 })
	const resizeStartSize = useRef<{ width: number; height: number }>({ width: 0, height: 0 })
	const resizeDirection = useRef<ResizeDirection>('se')
	const elementRef = useRef<HTMLDivElement>(null)

	// ドラッグ開始（マウス・タッチ共通）
	const handleDragStart = useCallback(
		(e: React.MouseEvent | React.TouchEvent) => {
			// マウスイベントの場合のみpreventDefaultを実行
			if ('button' in e) {
				e.preventDefault()
			}
			e.stopPropagation()

			// マウス/タッチ位置を取得（モバイル対応）
			let clientX: number
			let clientY: number

			if ('touches' in e) {
				// タッチイベントの場合
				const touch = e.touches[0]
				clientX = touch.clientX
				clientY = touch.clientY

				// モバイルでの座標補正
				if (elementRef.current) {
					const rect = elementRef.current.getBoundingClientRect()
					const viewport = elementRef.current.ownerDocument?.defaultView

					if (viewport) {
						// ビューポートのスケールとスクロール位置を考慮
						const scale = viewport.visualViewport?.scale || 1
						const scrollX = viewport.scrollX || 0
						const scrollY = viewport.scrollY || 0

						// 座標を補正
						clientX = (clientX + scrollX) / scale
						clientY = (clientY + scrollY) / scale
					}
				}
			} else {
				// マウスイベントの場合
				clientX = e.clientX
				clientY = e.clientY
			}

			// 位置を記録
			dragStartPos.current = { x: clientX, y: clientY }

			// 現在の要素の実際の位置を取得（倍率変更対応）
			if (elementRef.current) {
				const rect = elementRef.current.getBoundingClientRect()
				const parent = elementRef.current.parentElement
				const elementStyle = window.getComputedStyle(elementRef.current)

				if (parent) {
					const parentRect = parent.getBoundingClientRect()
					const parentStyle = window.getComputedStyle(parent)

					// 親要素のパディングとボーダーを取得
					const parentPaddingLeft = parseInt(parentStyle.paddingLeft, 10) || 0
					const parentPaddingTop = parseInt(parentStyle.paddingTop, 10) || 0
					const parentBorderLeft = parseInt(parentStyle.borderLeftWidth, 10) || 0
					const parentBorderTop = parseInt(parentStyle.borderTopWidth, 10) || 0

					// 親要素のCSS transformを取得
					const parentTransform = parentStyle.transform
					let parentTransformMatrix = null
					if (parentTransform && parentTransform !== 'none') {
						try {
							parentTransformMatrix = new DOMMatrix(parentTransform)
						} catch (error) {
							console.warn('[DraggableResize] Failed to parse parent transform:', error)
						}
					}

					// 倍率計算ユーティリティを使用
					const scaleInfo = calculateScaleWithViewport(elementRef.current)

					// スケールとパディング/ボーダーを考慮した相対位置を計算
					let relativeX = rect.left - parentRect.left - parentPaddingLeft - parentBorderLeft
					let relativeY = rect.top - parentRect.top - parentPaddingTop - parentBorderTop

					// CSS transformを考慮した位置調整（親要素のtransform）
					if (parentTransformMatrix) {
						// transformの逆行列を適用
						const inverseMatrix = parentTransformMatrix.inverse()
						const adjustedPoint = inverseMatrix.transformPoint({ x: relativeX, y: relativeY })
						relativeX = adjustedPoint.x
						relativeY = adjustedPoint.y
					}

					// 要素の倍率を考慮した位置調整（正規化）
					// 実際の表示座標を倍率で割って、論理座標に変換
					relativeX = relativeX / scaleInfo.totalScale
					relativeY = relativeY / scaleInfo.totalScale

					// 最終的な位置を保存
					dragStartElementPos.current = {
						x: relativeX,
						y: relativeY,
					}

					console.log('[DraggableResize] Position calculation with scale:', {
						rect: { left: rect.left, top: rect.top },
						parentRect: { left: parentRect.left, top: parentRect.top },
						padding: { left: parentPaddingLeft, top: parentPaddingTop },
						border: { left: parentBorderLeft, top: parentBorderTop },
						parentTransform,
						scaleInfo,
						relativePos: dragStartElementPos.current,
					})
				} else {
					// 親要素がない場合は現在のstate.positionを使用
					dragStartElementPos.current = { ...state.position }
				}
			} else {
				// 要素の参照がない場合は現在のstate.positionを使用
				dragStartElementPos.current = { ...state.position }
			}

			setState(prev => ({ ...prev, isDragging: true }))
			onDragStart?.()
		},
		[state.position, onDragStart]
	)

	// リサイズ開始（マウス・タッチ共通）
	const handleResizeStart = useCallback(
		(e: React.MouseEvent | React.TouchEvent, direction: ResizeDirection) => {
			// マウスイベントの場合のみpreventDefaultを実行
			if ('button' in e) {
				e.preventDefault()
			}
			e.stopPropagation()

			// マウス/タッチ位置を取得
			const clientX = 'touches' in e ? e.touches[0].clientX : e.clientX
			const clientY = 'touches' in e ? e.touches[0].clientY : e.clientY

			resizeStartPos.current = { x: clientX, y: clientY }
			resizeStartSize.current = { ...state.size }
			resizeDirection.current = direction

			setState(prev => ({ ...prev, isResizing: true }))
			onResizeStart?.()
		},
		[state.size, onResizeStart]
	)

	// マウス/タッチ移動処理
	const handleMouseMove = useCallback(
		(e: MouseEvent | TouchEvent) => {
			// マウス/タッチ位置を取得（モバイル対応）
			let clientX: number
			let clientY: number

			if ('touches' in e) {
				// タッチイベントの場合
				const touch = e.touches[0]
				clientX = touch.clientX
				clientY = touch.clientY

				// モバイルでの座標補正
				if (elementRef.current) {
					const viewport = elementRef.current.ownerDocument?.defaultView
					if (viewport) {
						const scale = viewport.visualViewport?.scale || 1
						const scrollX = viewport.scrollX || 0
						const scrollY = viewport.scrollY || 0

						// 座標を補正
						clientX = (clientX + scrollX) / scale
						clientY = (clientY + scrollY) / scale
					}
				}
			} else {
				// マウスイベントの場合
				clientX = e.clientX
				clientY = e.clientY
			}

			if (state.isDragging) {
				const deltaX = clientX - dragStartPos.current.x
				const deltaY = clientY - dragStartPos.current.y

				let newX = dragStartElementPos.current.x + deltaX
				let newY = dragStartElementPos.current.y + deltaY

				// 親要素の境界内に制限
				if (constrainToParent && elementRef.current?.parentElement) {
					const parent = elementRef.current.parentElement
					const parentRect = parent.getBoundingClientRect()
					const elementRect = elementRef.current.getBoundingClientRect()
					const parentStyle = window.getComputedStyle(parent)

					// 親要素のパディングとボーダーを取得
					const parentPaddingLeft = parseInt(parentStyle.paddingLeft, 10) || 0
					const parentPaddingTop = parseInt(parentStyle.paddingTop, 10) || 0
					const parentPaddingRight = parseInt(parentStyle.paddingRight, 10) || 0
					const parentPaddingBottom = parseInt(parentStyle.paddingBottom, 10) || 0
					const parentBorderLeft = parseInt(parentStyle.borderLeftWidth, 10) || 0
					const parentBorderTop = parseInt(parentStyle.borderTopWidth, 10) || 0

					// 親要素のCSS transformを取得
					const parentTransform = parentStyle.transform
					let parentTransformMatrix = null
					if (parentTransform && parentTransform !== 'none') {
						try {
							parentTransformMatrix = new DOMMatrix(parentTransform)
						} catch (error) {
							console.warn('[DraggableResize] Failed to parse parent transform for constraints:', error)
						}
					}

					// 利用可能な領域を計算（パディングとボーダーを考慮）
					const availableWidth = parent.clientWidth - parentPaddingLeft - parentPaddingRight
					const availableHeight = parent.clientHeight - parentPaddingTop - parentPaddingBottom

					// より正確な境界制限計算
					const maxX = Math.max(0, availableWidth - state.size.width)
					const maxY = Math.max(0, availableHeight - state.size.height)

					// パディングとボーダーを考慮した境界制限
					let constrainedX = Math.max(
						parentPaddingLeft + parentBorderLeft,
						Math.min(newX, maxX + parentPaddingLeft + parentBorderLeft)
					)
					let constrainedY = Math.max(
						parentPaddingTop + parentBorderTop,
						Math.min(newY, maxY + parentPaddingTop + parentBorderTop)
					)

					// CSS transformを考慮した位置調整
					if (parentTransformMatrix) {
						try {
							// transformの逆行列を適用して位置を調整
							const inverseMatrix = parentTransformMatrix.inverse()
							const adjustedPoint = inverseMatrix.transformPoint({ x: constrainedX, y: constrainedY })
							constrainedX = adjustedPoint.x
							constrainedY = adjustedPoint.y
						} catch (error) {
							console.warn('[DraggableResize] Failed to apply transform inverse for constraints:', error)
						}
					}

					newX = constrainedX
					newY = constrainedY
				}

				const newPosition = { x: newX, y: newY }

				// 倍率を考慮した最終位置の計算
				if (elementRef.current) {
					const scaleInfo = calculateScaleWithViewport(elementRef.current)

					// 正規化された座標を倍率で復元して実際の表示座標に変換
					newPosition.x = newPosition.x * scaleInfo.totalScale
					newPosition.y = newPosition.y * scaleInfo.totalScale
				}

				// デバッグ用：座標計算の詳細を記録（倍率情報付き）
				if (elementRef.current) {
					const scaleInfo = calculateScaleWithViewport(elementRef.current)

					console.log('[DraggableResize] Drag position update with scale:', {
						delta: { x: clientX - dragStartPos.current.x, y: clientY - dragStartPos.current.y },
						startElementPos: dragStartElementPos.current,
						calculatedPos: { x: newX, y: newY },
						finalPos: newPosition,
						isTouch: 'touches' in e,
						scaleInfo,
						constrained: constrainToParent,
					})
				}

				setState(prev => ({ ...prev, position: newPosition }))
				onDrag?.(newPosition)
			}

			if (state.isResizing) {
				const deltaX = clientX - resizeStartPos.current.x
				const deltaY = clientY - resizeStartPos.current.y

				let newWidth = resizeStartSize.current.width
				let newHeight = resizeStartSize.current.height

				const direction = resizeDirection.current

				// リサイズ方向に応じてサイズを計算
				if (direction.includes('e')) newWidth += deltaX
				if (direction.includes('w')) newWidth -= deltaX
				if (direction.includes('s')) newHeight += deltaY
				if (direction.includes('n')) newHeight -= deltaY

				// 最小・最大サイズで制限
				newWidth = Math.max(minSize.width, Math.min(maxSize.width, newWidth))
				newHeight = Math.max(minSize.height, Math.min(maxSize.height, newHeight))

				const newSize = { width: newWidth, height: newHeight }
				setState(prev => ({ ...prev, size: newSize }))
				onResize?.(newSize)
			}
		},
		[state.isDragging, state.isResizing, constrainToParent, minSize, maxSize, onDrag, onResize]
	)

	// マウス/タッチ終了処理
	const handleMouseUp = useCallback(() => {
		if (state.isDragging) {
			setState(prev => ({ ...prev, isDragging: false }))
			onDragEnd?.()
		}

		if (state.isResizing) {
			setState(prev => ({ ...prev, isResizing: false }))
			onResizeEnd?.()
		}
	}, [state.isDragging, state.isResizing, onDragEnd, onResizeEnd])

	// イベントリスナーの設定（マウス・タッチ対応）
	useEffect(() => {
		if (state.isDragging || state.isResizing) {
			// マウスイベント
			document.addEventListener('mousemove', handleMouseMove)
			document.addEventListener('mouseup', handleMouseUp)
			// タッチイベント
			document.addEventListener('touchmove', handleMouseMove, { passive: false })
			document.addEventListener('touchend', handleMouseUp)

			document.body.style.userSelect = 'none'
			document.body.style.cursor = state.isDragging ? 'grabbing' : 'default'

			return () => {
				// マウスイベント
				document.removeEventListener('mousemove', handleMouseMove)
				document.removeEventListener('mouseup', handleMouseUp)
				// タッチイベント
				document.removeEventListener('touchmove', handleMouseMove)
				document.removeEventListener('touchend', handleMouseUp)

				document.body.style.userSelect = ''
				document.body.style.cursor = ''
			}
		}
	}, [state.isDragging, state.isResizing, handleMouseMove, handleMouseUp])

	// キーボードアクセシビリティ
	const handleKeyDown = useCallback(
		(e: React.KeyboardEvent) => {
			const step = e.shiftKey ? 10 : 1
			let newPosition = { ...state.position }
			let newSize = { ...state.size }
			let positionChanged = false
			let sizeChanged = false

			// 位置移動（Ctrl + Arrow Keys）
			if (e.ctrlKey && !e.altKey) {
				switch (e.key) {
					case 'ArrowLeft':
						newPosition.x = Math.max(0, newPosition.x - step)
						positionChanged = true
						break
					case 'ArrowRight':
						newPosition.x += step
						positionChanged = true
						break
					case 'ArrowUp':
						newPosition.y = Math.max(0, newPosition.y - step)
						positionChanged = true
						break
					case 'ArrowDown':
						newPosition.y += step
						positionChanged = true
						break
				}
			}

			// サイズ変更（Ctrl + Alt + Arrow Keys）
			if (e.ctrlKey && e.altKey) {
				switch (e.key) {
					case 'ArrowLeft':
						newSize.width = Math.max(minSize.width, newSize.width - step)
						sizeChanged = true
						break
					case 'ArrowRight':
						newSize.width = Math.min(maxSize.width, newSize.width + step)
						sizeChanged = true
						break
					case 'ArrowUp':
						newSize.height = Math.max(minSize.height, newSize.height - step)
						sizeChanged = true
						break
					case 'ArrowDown':
						newSize.height = Math.min(maxSize.height, newSize.height + step)
						sizeChanged = true
						break
				}
			}

			if (positionChanged) {
				e.preventDefault()
				setState(prev => ({ ...prev, position: newPosition }))
				onDrag?.(newPosition)
			}

			if (sizeChanged) {
				e.preventDefault()
				setState(prev => ({ ...prev, size: newSize }))
				onResize?.(newSize)
			}
		},
		[state.position, state.size, minSize, maxSize, onDrag, onResize]
	)

	const handlers: DraggableResizeHandlers = {
		onMouseDown: handleDragStart,
		onResizeMouseDown: handleResizeStart,
	}

	return {
		state,
		handlers,
		elementRef,
		handleKeyDown,
		setState,
	}
}
