import { useEffect, RefObject } from 'react'

interface UseMenuKeyboardProps {
	isOpen: boolean
	menuRef: RefObject<HTMLDivElement>
	buttonRef: RefObject<HTMLButtonElement>
	firstMenuItemRef: RefObject<HTMLButtonElement>
	onClose: () => void
}

export const useMenuKeyboard = ({
	isOpen,
	menuRef,
	buttonRef,
	firstMenuItemRef,
	onClose,
}: UseMenuKeyboardProps) => {
	useEffect(() => {
		const handleKeyDown = (event: KeyboardEvent) => {
			if (!isOpen) return

			// メニューのフォーカス可能な要素を取得
			const getMenuItems = () => {
				if (!menuRef.current) return []
				return Array.from(menuRef.current.querySelectorAll('button:not(:disabled)'))
			}

			switch (event.key) {
				case 'Escape':
					event.preventDefault()
					onClose()
					buttonRef.current?.focus()
					break
				case 'ArrowDown':
					event.preventDefault()
					const menuItems = getMenuItems()
					const currentIndex = menuItems.findIndex(item => item === document.activeElement)
					const nextIndex = currentIndex < menuItems.length - 1 ? currentIndex + 1 : 0
					;(menuItems[nextIndex] as HTMLElement)?.focus()
					break
				case 'ArrowUp':
					event.preventDefault()
					const menuItemsUp = getMenuItems()
					const currentIndexUp = menuItemsUp.findIndex(item => item === document.activeElement)
					const prevIndex = currentIndexUp > 0 ? currentIndexUp - 1 : menuItemsUp.length - 1
					;(menuItemsUp[prevIndex] as HTMLElement)?.focus()
					break
				case 'Home':
					event.preventDefault()
					const firstItem = getMenuItems()[0] as HTMLElement
					firstItem?.focus()
					break
				case 'End':
					event.preventDefault()
					const menuItemsEnd = getMenuItems()
					const lastItem = menuItemsEnd[menuItemsEnd.length - 1] as HTMLElement
					lastItem?.focus()
					break
				case 'Tab':
					if (event.shiftKey) {
						// Shift+Tab: 前の要素
						if (document.activeElement === firstMenuItemRef.current) {
							event.preventDefault()
							buttonRef.current?.focus()
						}
					} else {
						// Tab: 次の要素
						if (document.activeElement === buttonRef.current) {
							event.preventDefault()
							firstMenuItemRef.current?.focus()
						}
					}
					break
			}
		}

		document.addEventListener('keydown', handleKeyDown)
		return () => {
			document.removeEventListener('keydown', handleKeyDown)
		}
	}, [isOpen, menuRef, buttonRef, firstMenuItemRef, onClose])
}
