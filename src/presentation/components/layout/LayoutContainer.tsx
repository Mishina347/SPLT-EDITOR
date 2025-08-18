import React, { ReactNode } from 'react'
import { DraggableContainer } from '../ui/DraggableContainer'
import { DISPLAY_MODE } from '../../../domain'

interface LayoutContainerProps {
	children: ReactNode
	layoutType: 'fixed' | 'draggable-dual' | 'draggable-editor' | 'draggable-preview'
	containerConfig?: {
		title: string
		initialPosition: { x: number; y: number }
		initialSize: { width: number; height: number }
		minSize: { width: number; height: number }
		maxSize: { width: number; height: number }
		isMaximized: boolean
		onPositionChange: (position: { x: number; y: number }) => void
		onSizeChange: (size: { width: number; height: number }) => void
		zIndex?: number
		onFocus?: () => void
		// カスタムヘッダー用
		customHeader?: React.ReactNode
		showDefaultHeader?: boolean
	}
	className?: string
	style?: React.CSSProperties
}

export const LayoutContainer: React.FC<LayoutContainerProps> = ({
	children,
	layoutType,
	containerConfig,
	className = '',
	style = {},
}) => {
	// 固定レイアウトの場合はDraggableContainerを使わない
	if (layoutType === 'fixed') {
		return (
			<div className={className} style={style}>
				{children}
			</div>
		)
	}

	// ドラッグ可能レイアウトの場合はDraggableContainerを使用
	if (containerConfig) {
		return (
			<DraggableContainer
				title={containerConfig.title}
				initialPosition={containerConfig.initialPosition}
				initialSize={containerConfig.initialSize}
				minSize={containerConfig.minSize}
				maxSize={containerConfig.maxSize}
				isMaximized={containerConfig.isMaximized}
				onPositionChange={containerConfig.onPositionChange}
				onSizeChange={containerConfig.onSizeChange}
				zIndex={containerConfig.zIndex}
				onFocus={containerConfig.onFocus}
				customHeader={containerConfig.customHeader}
				showDefaultHeader={containerConfig.showDefaultHeader}
				className={className}
			>
				{children}
			</DraggableContainer>
		)
	}

	// フォールバック: 通常のdiv
	return (
		<div className={className} style={style}>
			{children}
		</div>
	)
}
