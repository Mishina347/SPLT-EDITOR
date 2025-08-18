import React from 'react'

interface LayerIconProps {
	isDraggable?: boolean
	size?: number
	className?: string
}

export const LayerIcon: React.FC<LayerIconProps> = ({
	isDraggable = false,
	size = 32,
	className = '',
}) => {
	return (
		<svg
			width={size}
			height={size}
			viewBox="0 0 32 32"
			fill="none"
			xmlns="http://www.w3.org/2000/svg"
			className={className}
			aria-label={isDraggable ? 'ドラッグ可能状態を示すアイコン' : '固定レイアウト状態を示すアイコン'}
			role="img"
		>
			{isDraggable ? (
				// ドラッグ可能モード: レイヤーアイコン
				<>
					<rect x="15" y="4" width="2" height="24" fill="currentColor" />
					<path
						d="M10,7V25H4V7h6m0-2H4A2,2,0,0,0,2,7V25a2,2,0,0,0,2,2h6a2,2,0,0,0,2-2V7a2,2,0,0,0-2-2Z"
						fill="currentColor"
					/>
					<path
						d="M28,7V25H22V7h6m0-2H22a2,2,0,0,0-2,2V25a2,2,0,0,0,2,2h6a2,2,0,0,0,2-2V7a2,2,0,0,0-2-2Z"
						fill="currentColor"
					/>
				</>
			) : (
				// 固定モード: split-screenアイコン
				<>
					<g transform="translate(-108,-52)">
						<path
							d="m 123,70.999997 a 1,1 0 0 0 -1,1 1,1 0 0 0 1,1 h 10 a 1,1 0 0 0 1,-1 1,1 0 0 0 -1,-1 z"
							fill="currentColor"
						/>
						<path
							d="m 123,67 a 1,1 0 0 0 -1,1 1,1 0 0 0 1,1 h 10 a 1,1 0 0 0 1,-1 1,1 0 0 0 -1,-1 z"
							fill="currentColor"
						/>
						<path
							d="m 123,74.999997 a 1,1 0 0 0 -1,1 1,1 0 0 0 1,1 h 10 a 1,1 0 0 0 1,-1 1,1 0 0 0 -1,-1 z"
							fill="currentColor"
						/>
						<path
							d="m 113,54 c -1.6447,0 -3,1.355301 -3,3 v 13.999997 c 0,1.6447 1.3553,3 3,3 h 1 v 1 c 0,1.6447 1.3553,3 3,3 h 1 v 1 c 0,1.6447 1.3553,3 3,3 h 14 c 1.6447,0 3,-1.3553 3,-3 V 65 c 0,-1.644699 -1.3553,-3 -3,-3 h -1 v -1 c 0,-1.644699 -1.3553,-3 -3,-3 h -1 v -1 c 0,-1.644699 -1.3553,-3 -3,-3 z m 0,2 h 14 c 0.57129,0 1,0.428706 1,1 v 1 h -11 c -1.6447,0 -3,1.355301 -3,3 v 10.999997 h -1 c -0.57129,0 -1,-0.4287 -1,-1 V 57 c 0,-0.571294 0.42871,-1 1,-1 z m 4,4 h 14 c 0.57129,0 1,0.428706 1,1 v 1 h -11 c -1.6447,0 -3,1.355301 -3,3 v 10.999997 h -1 c -0.57129,0 -1,-0.4287 -1,-1 V 61 c 0,-0.571294 0.42871,-1 1,-1 z m 4,4 c 4.66667,0 9.33333,0 14,0 0.5713,0 1,0.428704 1,1 v 13.999997 c 0,0.5713 -0.4287,1 -1,1 h -14 c -0.5713,0 -1,-0.4287 -1,-1 0,-4.66666 0,-9.33333 0,-13.999997 0,-0.571296 0.4287,-1 1,-1 z"
							fill="currentColor"
						/>
					</g>
				</>
			)}
		</svg>
	)
}
