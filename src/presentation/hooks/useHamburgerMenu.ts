import { useState, useRef, useCallback, useEffect } from 'react'

interface UseHamburgerMenuProps {
	onThemeEdit: () => void
	onFileLoad: () => void
	onExportOpen?: () => void
}

export const useHamburgerMenu = ({
	onThemeEdit,
	onFileLoad,
	onExportOpen,
}: UseHamburgerMenuProps) => {
	const [isOpen, setIsOpen] = useState(false)
	const [showPWASection, setShowPWASection] = useState(false)
	const menuRef = useRef<HTMLDivElement>(null)
	const buttonRef = useRef<HTMLButtonElement>(null)
	const firstMenuItemRef = useRef<HTMLButtonElement>(null)

	// メニュー外クリックで閉じる
	useEffect(() => {
		const handleClickOutside = (event: MouseEvent) => {
			if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
				setIsOpen(false)
			}
		}

		document.addEventListener('mousedown', handleClickOutside)
		return () => {
			document.removeEventListener('mousedown', handleClickOutside)
		}
	}, [])

	// メニューが開いた時に最初のメニュー項目にフォーカス
	useEffect(() => {
		if (isOpen && firstMenuItemRef.current) {
			setTimeout(() => {
				firstMenuItemRef.current?.focus()
			}, 100)
		}
	}, [isOpen])

	const handleThemeEdit = useCallback(() => {
		onThemeEdit()
		setIsOpen(false)
		buttonRef.current?.focus()
	}, [onThemeEdit])

	const handleExportClick = useCallback(() => {
		onExportOpen?.()
		setIsOpen(false)
		buttonRef.current?.focus()
	}, [onExportOpen])

	const handleFileLoad = useCallback(() => {
		onFileLoad()
		setIsOpen(false)
		buttonRef.current?.focus()
	}, [onFileLoad])

	const handlePWASectionToggle = useCallback(() => {
		setShowPWASection(!showPWASection)
	}, [showPWASection])

	const toggleMenu = useCallback(() => {
		setIsOpen(prev => {
			const newIsOpen = !prev
			if (!newIsOpen) {
				setShowPWASection(false) // メニューを開く時にPWAセクションをリセット
			}
			return newIsOpen
		})
	}, [])

	return {
		isOpen,
		showPWASection,
		menuRef,
		buttonRef,
		firstMenuItemRef,
		handleThemeEdit,
		handleExportClick,
		handleFileLoad,
		handlePWASectionToggle,
		toggleMenu,
	}
}
