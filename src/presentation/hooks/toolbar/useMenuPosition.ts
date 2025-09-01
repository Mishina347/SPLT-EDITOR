import { useState, useEffect, RefObject } from 'react'

interface MenuPosition {
	top: number
	left: number
}

interface UseMenuPositionProps {
	isOpen: boolean
	showPWASection: boolean
	buttonRef: RefObject<HTMLButtonElement>
}

export const useMenuPosition = ({ isOpen, showPWASection, buttonRef }: UseMenuPositionProps) => {
	const [menuPosition, setMenuPosition] = useState<MenuPosition>({ top: 0, left: 0 })

	// メニューの位置を計算
	useEffect(() => {
		if (isOpen && buttonRef.current) {
			const buttonRect = buttonRef.current.getBoundingClientRect()
			const menuWidth = showPWASection ? 280 : 140 // PWAセクション表示時は幅を広げる

			let left = buttonRect.left
			let top = buttonRect.bottom + 4 // ボタンの下に4px間隔で配置

			// 右端が見切れる場合は左に調整
			if (left + menuWidth > window.innerWidth) {
				left = buttonRect.right - menuWidth
			}

			// 左端が見切れる場合は右に調整
			if (left < 0) {
				left = 8 // 最小マージン
			}

			// 下端が見切れる場合は上に表示
			if (top + 300 > window.innerHeight) {
				// PWAセクション表示時は高さを増加
				top = buttonRect.top - 8 // ボタンの上に配置
			}

			setMenuPosition({ top, left })
		}
	}, [isOpen, showPWASection, buttonRef])

	// ウィンドウリサイズやスクロール時にメニュー位置を再計算
	useEffect(() => {
		if (!isOpen) return

		const updatePosition = () => {
			if (buttonRef.current) {
				const buttonRect = buttonRef.current.getBoundingClientRect()
				const menuWidth = showPWASection ? 280 : 140

				let left = buttonRect.left
				let top = buttonRect.bottom + 4

				if (left + menuWidth > window.innerWidth) {
					left = buttonRect.right - menuWidth
				}

				if (left < 0) {
					left = 8
				}

				if (top + 300 > window.innerHeight) {
					top = buttonRect.top - 8
				}

				setMenuPosition({ top, left })
			}
		}

		window.addEventListener('resize', updatePosition)
		window.addEventListener('scroll', updatePosition, true)

		return () => {
			window.removeEventListener('resize', updatePosition)
			window.removeEventListener('scroll', updatePosition, true)
		}
	}, [isOpen, showPWASection, buttonRef])

	return menuPosition
}
