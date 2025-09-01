import { useCallback, useRef, useState, useEffect } from 'react'
import { calculateScaleWithViewport } from '@/utils'

export interface DraggableResizeState {
	position: { x: number; y: number }
	size: { width: number; height: number }
	isDragging: boolean
	isResizing: boolean
}

export interface DraggableResizeHandlers {
	onMouseDown: (e: React.MouseEvent | React.TouchEvent) => void
	onResizeMouseDown: (e: React.MouseEvent | React.TouchEvent, direction: ResizeDirection) => void
	updatePositionForScaleChange: () => void // 倍率変更時の座標更新を外部から呼び出し可能
}

export type ResizeDirection = 'n' | 's' | 'e' | 'w' | 'ne' | 'nw' | 'se' | 'sw'

interface UseDraggableResizeOptions {
	initialPosition: { x: number; y: number }
	initialSize: { width: number; height: number }
	minSize: { width: number; height: number }
	maxSize: { width: number; height: number }
	constrainToParent?: boolean
	allowOutsideViewport?: boolean
	onDrag?: (position: { x: number; y: number }) => void
	onResize?: (size: { width: number; height: number }) => void
	onDragStart?: () => void
	onDragEnd?: () => void
	onResizeStart?: () => void
	onResizeEnd?: () => void
}

export const useDraggableResize = (options: UseDraggableResizeOptions) => {
	const {
		initialPosition,
		initialSize,
		minSize,
		maxSize,
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
		position: initialPosition ?? { x: 100, y: 100 },
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

	// タッチIDの追跡（UNKNOWN touch警告の防止）
	const activeTouchId = useRef<number | null>(null)
	const isTouchActive = useRef<boolean>(false)
	const touchStartTime = useRef<number>(0)

	// タッチ開始時の正確な座標を記録（onDrag開始時のずれ防止）
	const touchStartPos = useRef<{ x: number; y: number }>({ x: 0, y: 0 })
	const touchStartElementPos = useRef<{ x: number; y: number }>({ x: 0, y: 0 })
	const lastScaleInfo = useRef<{ totalScale: number; viewportScale: number }>({
		totalScale: 1,
		viewportScale: 1,
	})
	const initialScaleInfo = useRef<{ totalScale: number; viewportScale: number }>({
		totalScale: 1,
		viewportScale: 1,
	})

	// PC・モバイル共通の座標補正処理
	const applyCoordinateCorrection = useCallback(
		(rawX: number, rawY: number, element: HTMLElement) => {
			const viewport = element.ownerDocument?.defaultView
			if (!viewport) return { x: rawX, y: rawY }

			// ビューポートのスケールとスクロール位置を取得
			const scale = viewport.visualViewport?.scale || 1
			const scrollX = viewport.scrollX || 0
			const scrollY = viewport.scrollY || 0

			// 座標を補正（PC・モバイル共通）
			const correctedX = (rawX + scrollX) / scale
			const correctedY = (rawY + scrollY) / scale

			return { x: correctedX, y: correctedY }
		},
		[]
	)

	// 倍率変更時の座標更新処理
	const updatePositionForScaleChange = useCallback(() => {
		if (!elementRef.current) return

		const currentScaleInfo = calculateScaleWithViewport(elementRef.current)
		const lastScale = lastScaleInfo.current.totalScale * lastScaleInfo.current.viewportScale
		const currentScale = currentScaleInfo.totalScale * currentScaleInfo.viewportScale

		// 倍率が変更された場合のみ座標を更新
		if (Math.abs(currentScale - lastScale) > 0.01) {
			// 倍率変更に応じて座標を調整
			const scaleRatio = currentScale / lastScale
			const newPosition = {
				x: state.position.x * scaleRatio,
				y: state.position.y * scaleRatio,
			}

			setState(prev => ({
				...prev,
				position: newPosition,
			}))

			// 新しい倍率情報を保存
			lastScaleInfo.current = {
				totalScale: currentScaleInfo.totalScale,
				viewportScale: currentScaleInfo.viewportScale,
			}
		}
	}, [state.position, applyCoordinateCorrection])

	// ピンチ完了後に縮尺無しの現在位置を取得
	const getCurrentPositionWithoutScale = useCallback(() => {
		if (!elementRef.current) return null

		const currentScaleInfo = calculateScaleWithViewport(elementRef.current)
		const totalScale = currentScaleInfo.totalScale * currentScaleInfo.viewportScale

		// 現在の表示位置を縮尺で割って、縮尺無しの位置を取得
		const positionWithoutScale = {
			x: state.position.x / totalScale,
			y: state.position.y / totalScale,
		}

		return positionWithoutScale
	}, [state.position])

	// ピンチ完了時の位置更新処理
	const updatePositionAfterPinch = useCallback(() => {
		if (!elementRef.current) return

		const currentScaleInfo = calculateScaleWithViewport(elementRef.current)
		const totalScale = currentScaleInfo.totalScale * currentScaleInfo.viewportScale

		// 現在の表示位置を縮尺で割って、縮尺無しの位置を取得
		const positionWithoutScale = {
			x: state.position.x / totalScale,
			y: state.position.y / totalScale,
		}

		// 縮尺無しの位置で状態を更新
		setState(prev => ({
			...prev,
			position: positionWithoutScale,
		}))

		// 倍率情報を更新
		lastScaleInfo.current = {
			totalScale: currentScaleInfo.totalScale,
			viewportScale: currentScaleInfo.viewportScale,
		}

		return positionWithoutScale
	}, [state.position])

	// 最初の縮尺を基準とした座標計算
	const getPositionWithInitialScale = useCallback(() => {
		if (!elementRef.current) return null

		const currentScaleInfo = calculateScaleWithViewport(elementRef.current)
		const currentTotalScale = currentScaleInfo.totalScale * currentScaleInfo.viewportScale
		const initialTotalScale =
			initialScaleInfo.current.totalScale * initialScaleInfo.current.viewportScale

		// 現在の位置を最初の縮尺で正規化
		const normalizedPosition = {
			x: state.position.x * (initialTotalScale / currentTotalScale),
			y: state.position.y * (initialTotalScale / currentTotalScale),
		}

		return normalizedPosition
	}, [state.position])

	// 最初の縮尺を基準としたタッチ座標計算
	const applyCoordinateCorrectionWithInitialScale = useCallback(
		(rawX: number, rawY: number, element: HTMLElement) => {
			const viewport = element.ownerDocument?.defaultView
			if (!viewport) return { x: rawX, y: rawY }

			// ビューポートのスケールとスクロール位置を取得
			const currentScale = viewport.visualViewport?.scale || 1
			const scrollX = viewport.scrollX || 0
			const scrollY = viewport.scrollY || 0

			// 最初の縮尺を基準とした座標補正
			const initialTotalScale =
				initialScaleInfo.current.totalScale * initialScaleInfo.current.viewportScale
			const scaleRatio = initialTotalScale / currentScale

			// 座標を補正（最初の縮尺基準）
			const correctedX = (rawX + scrollX) * scaleRatio
			const correctedY = (rawY + scrollY) * scaleRatio

			return { x: correctedX, y: correctedY }
		},
		[]
	)

	// 倍率変更の監視
	useEffect(() => {
		if (!elementRef.current) return

		const element = elementRef.current
		const resizeObserver = new ResizeObserver(() => {
			// リサイズ後に倍率変更をチェック
			setTimeout(updatePositionForScaleChange, 0)
		})

		// 初期倍率を記録
		const scaleInfo = calculateScaleWithViewport(element)
		initialScaleInfo.current = {
			totalScale: scaleInfo.totalScale,
			viewportScale: scaleInfo.viewportScale,
		}
		lastScaleInfo.current = {
			totalScale: scaleInfo.totalScale,
			viewportScale: scaleInfo.viewportScale,
		}

		resizeObserver.observe(element)

		return () => {
			resizeObserver.disconnect()
		}
	}, [updatePositionForScaleChange])

	// ドラッグ開始（マウス・タッチ共通）
	const handleDragStart = useCallback(
		(e: React.MouseEvent | React.TouchEvent) => {
			// ドラッグ開始前に倍率変更をチェックして座標を更新
			updatePositionForScaleChange()

			// マウスイベントの場合のみpreventDefaultを実行
			if ('button' in e) {
				e.preventDefault()
			}
			e.stopPropagation()

			// マウス/タッチ位置を取得（PC・モバイル共通の座標補正）
			let clientX: number
			let clientY: number

			if ('touches' in e) {
				// タッチイベントの場合
				const touch = e.touches[0]
				clientX = touch.clientX
				clientY = touch.clientY

				// タッチ状態を記録（UNKNOWN touch警告の防止）
				activeTouchId.current = touch.identifier
				isTouchActive.current = true
				touchStartTime.current = Date.now()

				// タッチ開始時の正確な座標を記録（onDrag開始時のずれ防止）
				touchStartPos.current = { x: clientX, y: clientY }
			} else {
				// マウスイベントの場合
				clientX = e.clientX
				clientY = e.clientY

				// マウスイベントの場合はタッチ状態をクリア
				activeTouchId.current = null
				isTouchActive.current = false
				touchStartTime.current = 0
			}

			// 最初の縮尺を基準とした座標補正（ピンチ操作後のタッチ座標を正規化）
			if (elementRef.current) {
				const corrected = applyCoordinateCorrectionWithInitialScale(
					clientX,
					clientY,
					elementRef.current
				)
				clientX = corrected.x
				clientY = corrected.y
			}

			// 位置を記録（タッチ開始時の座標を使用）
			if ('touches' in e) {
				// タッチイベントの場合は、タッチ開始時の座標を使用
				dragStartPos.current = { x: touchStartPos.current.x, y: touchStartPos.current.y }
			} else {
				// マウスイベントの場合は、補正後の座標を使用
				dragStartPos.current = { x: clientX, y: clientY }
			}

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

					// タッチイベントの場合は、タッチ開始時の要素位置も記録
					if ('touches' in e) {
						touchStartElementPos.current = {
							x: relativeX,
							y: relativeY,
						}
					}
				} else {
					// 親要素がない場合は現在のstate.positionを使用
					dragStartElementPos.current = { ...state.position }

					// タッチイベントの場合は、タッチ開始時の要素位置も記録
					if ('touches' in e) {
						touchStartElementPos.current = { ...state.position }
					}
				}
			} else {
				// 要素の参照がない場合は現在のstate.positionを使用
				dragStartElementPos.current = { ...state.position }

				// タッチイベントの場合は、タッチ開始時の要素位置も記録
				if ('touches' in e) {
					touchStartElementPos.current = { ...state.position }
				}
			}

			setState(prev => ({ ...prev, isDragging: true }))
			onDragStart?.()
		},
		[state.position, onDragStart]
	)

	// リサイズ開始（マウス・タッチ共通）
	const handleResizeStart = useCallback(
		(e: React.MouseEvent | React.TouchEvent, direction: ResizeDirection) => {
			// リサイズ開始前に倍率変更をチェックして座標を更新
			updatePositionForScaleChange()

			// マウスイベントの場合のみpreventDefaultを実行
			if ('button' in e) {
				e.preventDefault()
			}
			e.stopPropagation()

			// マウス/タッチ位置を取得（PC・モバイル共通の座標補正）
			let clientX: number
			let clientY: number

			if ('touches' in e) {
				// タッチイベントの場合
				const touch = e.touches[0]
				clientX = touch.clientX
				clientY = touch.clientY

				// タッチ状態を記録（UNKNOWN touch警告の防止）
				activeTouchId.current = touch.identifier
				isTouchActive.current = true
				touchStartTime.current = Date.now()
			} else {
				// マウスイベントの場合
				clientX = e.clientX
				clientY = e.clientY

				// マウスイベントの場合はタッチ状態をクリア
				activeTouchId.current = null
				isTouchActive.current = false
				touchStartTime.current = 0
			}

			// 最初の縮尺を基準とした座標補正（ピンチ操作後のタッチ座標を正規化）
			if (elementRef.current) {
				const corrected = applyCoordinateCorrectionWithInitialScale(
					clientX,
					clientY,
					elementRef.current
				)
				clientX = corrected.x
				clientY = corrected.y
			}

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
			// マウス/タッチ位置を取得（PC・モバイル共通の座標補正）
			let clientX: number
			let clientY: number

			if ('touches' in e) {
				// タッチイベントの場合
				const touch = e.touches[0]

				// タッチ状態の厳密なチェック（UNKNOWN touch警告の防止）
				if (!isTouchActive.current || activeTouchId.current === null) {
					// タッチが開始されていない場合は無視
					return
				}

				if (touch.identifier !== activeTouchId.current) {
					// 異なるタッチIDの場合は無視
					return
				}

				// タッチ開始から一定時間経過しているかチェック
				const touchDuration = Date.now() - touchStartTime.current
				if (touchDuration < 50) {
					// タッチ開始直後は無視（誤動作防止）
					return
				}

				clientX = touch.clientX
				clientY = touch.clientY
			} else {
				// マウスイベントの場合
				clientX = e.clientX
				clientY = e.clientY
			}

			// 最初の縮尺を基準とした座標補正（ピンチ操作後のタッチ座標を正規化）
			if (elementRef.current) {
				const corrected = applyCoordinateCorrectionWithInitialScale(
					clientX,
					clientY,
					elementRef.current
				)
				clientX = corrected.x
				clientY = corrected.y
			}

			if (state.isDragging) {
				// タッチイベントの場合は、タッチ開始時の座標を基準に計算
				let deltaX: number
				let deltaY: number

				if ('touches' in e) {
					// タッチイベントの場合
					deltaX = clientX - touchStartPos.current.x
					deltaY = clientY - touchStartPos.current.y
				} else {
					// マウスイベントの場合
					deltaX = clientX - dragStartPos.current.x
					deltaY = clientY - dragStartPos.current.y
				}

				// タッチイベントの場合は、タッチ開始時の要素位置を使用
				let newX: number
				let newY: number

				if ('touches' in e) {
					newX = touchStartElementPos.current.x + deltaX
					newY = touchStartElementPos.current.y + deltaY
				} else {
					newX = dragStartElementPos.current.x + deltaX
					newY = dragStartElementPos.current.y + deltaY
				}

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

				// 座標計算完了（倍率情報付き）

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

		// タッチ状態をクリア（UNKNOWN touch警告の防止）
		activeTouchId.current = null
		isTouchActive.current = false
		touchStartTime.current = 0
	}, [state.isDragging, state.isResizing, onDragEnd, onResizeEnd])

	// イベントリスナーの設定（PC・モバイル共通）
	useEffect(() => {
		if (state.isDragging || state.isResizing) {
			// PC・モバイル共通のイベントリスナー設定
			document.addEventListener('mousemove', handleMouseMove)
			document.addEventListener('mouseup', handleMouseUp)

			// タッチイベントの設定（モバイルドラッグの安定性向上）
			document.addEventListener('touchmove', handleMouseMove, {
				passive: false, // preventDefaultを許可
				capture: true, // キャプチャフェーズで処理
			})
			document.addEventListener('touchend', handleMouseUp, {
				passive: false,
				capture: true,
			})
			// タッチキャンセルイベントも処理
			document.addEventListener('touchcancel', handleMouseUp, {
				passive: false,
				capture: true,
			})

			// ユーザー体験の改善
			document.body.style.userSelect = 'none'
			document.body.style.cursor = state.isDragging ? 'grabbing' : 'default'

			return () => {
				// イベントリスナーのクリーンアップ
				document.removeEventListener('mousemove', handleMouseMove)
				document.removeEventListener('mouseup', handleMouseUp)
				document.removeEventListener('touchmove', handleMouseMove, { capture: true })
				document.removeEventListener('touchend', handleMouseUp, { capture: true })
				document.removeEventListener('touchcancel', handleMouseUp, { capture: true })

				// スタイルの復元
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
		updatePositionForScaleChange,
	}

	return {
		state,
		handlers,
		elementRef,
		handleKeyDown,
		setState,
		getCurrentPositionWithoutScale,
		updatePositionAfterPinch,
		getPositionWithInitialScale,
		applyCoordinateCorrectionWithInitialScale,
	}
}
