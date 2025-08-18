import React, { useState, useRef, useEffect } from 'react'
import { createPortal } from 'react-dom'
import styles from './OverflowMenu.module.css'

interface OverflowMenuItem {
	id: string
	element: HTMLElement
}

interface OverflowMenuProps {
	items: OverflowMenuItem[]
	visible: boolean
	className?: string
}

export const OverflowMenu: React.FC<OverflowMenuProps> = ({ items, visible, className = '' }) => {
	const [isOpen, setIsOpen] = useState(false)
	const [menuPosition, setMenuPosition] = useState({ top: 0, left: 0 })
	const buttonRef = useRef<HTMLButtonElement>(null)
	const menuRef = useRef<HTMLDivElement>(null)

	// メニュー位置の計算
	const updateMenuPosition = () => {
		if (buttonRef.current) {
			const buttonRect = buttonRef.current.getBoundingClientRect()
			const scrollTop = window.pageYOffset || document.documentElement.scrollTop
			const scrollLeft = window.pageXOffset || document.documentElement.scrollLeft

			// ボタンの下側に表示
			const top = buttonRect.bottom + scrollTop + 5
			const left = buttonRect.right + scrollLeft - 200 // メニュー幅を考慮して右寄せ

			setMenuPosition({ top, left })
		}
	}

	// ボタンクリック時の処理
	const handleToggle = () => {
		if (!isOpen) {
			updateMenuPosition()
		}
		setIsOpen(!isOpen)
	}

	// メニュー外クリックで閉じる
	useEffect(() => {
		if (!isOpen) return

		const handleClickOutside = (event: MouseEvent) => {
			if (
				menuRef.current &&
				!menuRef.current.contains(event.target as Node) &&
				buttonRef.current &&
				!buttonRef.current.contains(event.target as Node)
			) {
				setIsOpen(false)
			}
		}

		const handleEscape = (event: KeyboardEvent) => {
			if (event.key === 'Escape') {
				setIsOpen(false)
				buttonRef.current?.focus()
			}
		}

		document.addEventListener('mousedown', handleClickOutside)
		document.addEventListener('keydown', handleEscape)

		return () => {
			document.removeEventListener('mousedown', handleClickOutside)
			document.removeEventListener('keydown', handleEscape)
		}
	}, [isOpen])

	// ウィンドウリサイズ時にメニュー位置を更新
	useEffect(() => {
		if (!isOpen) return

		const handleResize = () => updateMenuPosition()
		const handleScroll = () => updateMenuPosition()

		window.addEventListener('resize', handleResize)
		window.addEventListener('scroll', handleScroll)

		return () => {
			window.removeEventListener('resize', handleResize)
			window.removeEventListener('scroll', handleScroll)
		}
	}, [isOpen])

	// アイテムがない場合は表示しない
	if (!visible || items.length === 0) {
		return null
	}

	return (
		<div className={`${styles.overflowContainer} ${className}`}>
			<button
				ref={buttonRef}
				className={styles.overflowButton}
				onClick={handleToggle}
				aria-label="その他のツール"
				aria-expanded={isOpen}
				aria-haspopup="true"
			>
				<svg
					width="24"
					height="24"
					viewBox="0 0 24 24"
					fill="none"
					xmlns="http://www.w3.org/2000/svg"
					aria-hidden="true"
				>
					<path
						d="M6 12H6.01M12 12H12.01M18 12H18.01M7 12C7 12.5523 6.55228 13 6 13C5.44772 13 5 12.5523 5 12C5 11.4477 5.44772 11 6 11C6.55228 11 7 11.4477 7 12ZM13 12C13 12.5523 12.5523 13 12 13C11.4477 13 11 12.5523 11 12C11 11.4477 11.4477 11 12 11C12.5523 11 13 11.4477 13 12ZM19 12C19 12.5523 18.5523 13 18 13C17.4477 13 17 12.5523 17 12C17 11.4477 17.4477 11 18 11C18.5523 11 19 11.4477 19 12Z"
						stroke="currentColor"
						strokeWidth="2"
						strokeLinecap="round"
						strokeLinejoin="round"
					/>
				</svg>
			</button>

			{isOpen &&
				createPortal(
					<div
						ref={menuRef}
						className={styles.overflowMenu}
						style={{
							position: 'fixed',
							top: menuPosition.top,
							left: menuPosition.left,
							zIndex: 9999,
						}}
						role="menu"
						aria-labelledby="overflow-button"
					>
						<div className={styles.overflowContent}>
							{items.map(item => {
								// 元の要素をクローンして、イベントリスナーも含めて複製
								const clonedElement = item.element.cloneNode(true) as HTMLElement
								// クローンされた要素にユニークなIDを設定
								clonedElement.id = `overflow-${item.id}`

								return (
									<div
										key={item.id}
										className={styles.overflowItem}
										ref={node => {
											if (node && clonedElement) {
												// 既存の内容をクリア
												node.innerHTML = ''
												// クローンされた要素を追加
												node.appendChild(clonedElement)
											}
										}}
									/>
								)
							})}
						</div>
					</div>,
					document.body
				)}
		</div>
	)
}
