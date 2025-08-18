import { useCallback, useRef, useState, useEffect } from 'react'

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

			// マウス/タッチ位置を取得
			const clientX = 'touches' in e ? e.touches[0].clientX : e.clientX
			const clientY = 'touches' in e ? e.touches[0].clientY : e.clientY

			// 位置を記録
			dragStartPos.current = { x: clientX, y: clientY }

			// 現在の要素の実際の位置を取得
			if (elementRef.current) {
				const rect = elementRef.current.getBoundingClientRect()
				const parent = elementRef.current.parentElement
				if (parent) {
					const parentRect = parent.getBoundingClientRect()
					// 親要素からの相対位置を計算
					dragStartElementPos.current = {
						x: rect.left - parentRect.left,
						y: rect.top - parentRect.top,
					}
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
			// マウス/タッチ位置を取得
			const clientX = 'touches' in e ? e.touches[0].clientX : e.clientX
			const clientY = 'touches' in e ? e.touches[0].clientY : e.clientY

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

					// 親要素のクライアント領域を取得（スクロールバーやパディングを考慮）
					const parentStyle = window.getComputedStyle(parent)
					const parentPaddingLeft = parseInt(parentStyle.paddingLeft, 10) || 0
					const parentPaddingTop = parseInt(parentStyle.paddingTop, 10) || 0
					const parentPaddingRight = parseInt(parentStyle.paddingRight, 10) || 0
					const parentPaddingBottom = parseInt(parentStyle.paddingBottom, 10) || 0

					const availableWidth = parent.clientWidth - parentPaddingLeft - parentPaddingRight
					const availableHeight = parent.clientHeight - parentPaddingTop - parentPaddingBottom

					// より正確な境界制限計算
					const maxX = Math.max(0, availableWidth - state.size.width)
					const maxY = Math.max(0, availableHeight - state.size.height)

					newX = Math.max(parentPaddingLeft, Math.min(newX, maxX))
					newY = Math.max(parentPaddingTop, Math.min(newY, maxY))
				}

				const newPosition = { x: newX, y: newY }

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
