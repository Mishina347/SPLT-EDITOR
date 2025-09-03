import React from 'react'
import styles from './ResizeHandle.module.css'
import { ResizeDirection } from '@/presentation/hooks/layout/useDraggableResize'

interface ResizeHandleProps {
	direction: ResizeDirection
	onMouseDown: (e: React.MouseEvent | React.TouchEvent, direction: ResizeDirection) => void
	visible?: boolean
}

const getCursorForDirection = (direction: ResizeDirection): string => {
	switch (direction) {
		case 'n':
		case 's':
			return 'ns-resize'
		case 'e':
		case 'w':
			return 'ew-resize'
		case 'ne':
		case 'sw':
			return 'nesw-resize'
		case 'nw':
		case 'se':
			return 'nwse-resize'
		default:
			return 'default'
	}
}

const getPositionClasses = (direction: ResizeDirection): string => {
	switch (direction) {
		case 'n':
			return styles.top
		case 's':
			return styles.bottom
		case 'e':
			return styles.right
		case 'w':
			return styles.left
		case 'ne':
			return styles.topRight
		case 'nw':
			return styles.topLeft
		case 'se':
			return styles.bottomRight
		case 'sw':
			return styles.bottomLeft
		default:
			return ''
	}
}

export const ResizeHandle: React.FC<ResizeHandleProps> = ({
	direction,
	onMouseDown,
	visible = true,
}) => {
	if (!visible) return null

	const handleMouseDown = (e: React.MouseEvent) => {
		e.preventDefault()
		e.stopPropagation()
		onMouseDown(e, direction)
	}

	const handleTouchStart = (e: React.TouchEvent) => {
		e.preventDefault() // ResizeHandleでは常にpreventDefaultを実行
		e.stopPropagation()
		onMouseDown(e, direction)
	}

	return (
		<div
			className={`${styles.resizeHandle} ${getPositionClasses(direction)}`}
			style={{ cursor: getCursorForDirection(direction) }}
			onMouseDown={handleMouseDown}
			onTouchStart={handleTouchStart}
			role="button"
			tabIndex={0}
			aria-label={`リサイズハンドル (${direction})`}
			onKeyDown={e => {
				if (e.key === 'Enter' || e.key === ' ') {
					e.preventDefault()
					// キーボードでのリサイズ開始
				}
			}}
		/>
	)
}
