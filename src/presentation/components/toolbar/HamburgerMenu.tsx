import React, { useState, useRef, useEffect } from 'react'
import { createPortal } from 'react-dom'
import { useFullscreen } from '../../hooks'
import { usePWA } from '../../hooks/usePWA'
import { PWAInstallButton } from '../pwa/PWAInstallButton'
import { PWAStatus } from '../pwa/PWAStatus'
import styles from './HamburgerMenu.module.css'

// PWAインストール用の型定義
declare global {
	interface Window {
		deferredPrompt: any
	}
}

interface HamburgerMenuProps {
	onThemeEdit: () => void
	onFileLoad: () => void
	onExportOpen?: () => void
}

export const HamburgerMenu: React.FC<HamburgerMenuProps> = ({
	onThemeEdit,
	onFileLoad,
	onExportOpen,
}) => {
	const [isOpen, setIsOpen] = useState(false)
	const [menuPosition, setMenuPosition] = useState({ top: 0, left: 0 })
	const [showPWASection, setShowPWASection] = useState(false)
	const menuRef = useRef<HTMLDivElement>(null)
	const buttonRef = useRef<HTMLButtonElement>(null)
	const firstMenuItemRef = useRef<HTMLButtonElement>(null)

	// フルスクリーン機能
	const { isFullscreen, toggleFullscreen } = useFullscreen()

	// PWA機能
	const {
		isInstallable,
		isInstalled,
		isOffline,
		isUpdateAvailable,
		updateServiceWorker,
		clearCache,
		requestNotificationPermission,
		sendNotification,
	} = usePWA()

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
	}, [isOpen, showPWASection])

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
	}, [isOpen, showPWASection])

	// キーボードナビゲーション
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
					setIsOpen(false)
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
	}, [isOpen])

	// メニューが開いた時に最初のメニュー項目にフォーカス
	useEffect(() => {
		if (isOpen && firstMenuItemRef.current) {
			setTimeout(() => {
				firstMenuItemRef.current?.focus()
			}, 100)
		}
	}, [isOpen])

	const handleThemeEdit = () => {
		onThemeEdit()
		setIsOpen(false)
		buttonRef.current?.focus()
	}

	const handleExportClick = () => {
		onExportOpen?.()
		setIsOpen(false)
		buttonRef.current?.focus()
	}

	const handleFileLoad = () => {
		onFileLoad()
		setIsOpen(false)
		buttonRef.current?.focus()
	}

	const handleFullscreenToggle = () => {
		toggleFullscreen()
		setIsOpen(false)
		buttonRef.current?.focus()
	}

	const handlePWASectionToggle = () => {
		setShowPWASection(!showPWASection)
	}

	const handleUpdateServiceWorker = async () => {
		try {
			await updateServiceWorker()
		} catch (error) {
			console.error('Service Workerの更新に失敗しました:', error)
		}
	}

	const handleClearCache = async () => {
		try {
			await clearCache()
			console.log('キャッシュがクリアされました')
		} catch (error) {
			console.error('キャッシュのクリアに失敗しました:', error)
		}
	}

	const handleRequestNotificationPermission = async () => {
		try {
			const granted = await requestNotificationPermission()
			if (granted) {
				console.log('通知の許可が得られました')
			}
		} catch (error) {
			console.error('通知の許可要求に失敗しました:', error)
		}
	}

	const handleTestNotification = () => {
		try {
			sendNotification('テスト通知', { body: 'PWA通知が正常に動作しています' })
		} catch (error) {
			console.error('テスト通知の送信に失敗しました:', error)
		}
	}

	const toggleMenu = () => {
		setIsOpen(!isOpen)
		if (!isOpen) {
			setShowPWASection(false) // メニューを開く時にPWAセクションをリセット
		}
	}

	return (
		<div className={styles.hamburgerContainer} ref={menuRef}>
			<button
				ref={buttonRef}
				className={styles.hamburgerButton}
				onClick={toggleMenu}
				aria-expanded={isOpen}
				aria-pressed={isOpen}
				aria-haspopup="true"
				aria-controls="hamburger-menu"
				aria-label={isOpen ? 'メニューを閉じる' : 'メニューを開く'}
			>
				<div className={`${styles.hamburgerIcon} ${isOpen ? styles.open : ''}`}>
					<span aria-hidden="true"></span>
					<span aria-hidden="true"></span>
					<span aria-hidden="true"></span>
				</div>
			</button>

			{isOpen &&
				createPortal(
					<div
						ref={menuRef}
						id="hamburger-menu"
						className={styles.menuDropdown}
						role="menu"
						aria-labelledby="hamburger-button"
						style={{
							position: 'fixed',
							top: menuPosition.top,
							left: menuPosition.left,
							zIndex: 9999, // 最上位に表示
						}}
					>
						{/* 基本メニュー項目 */}
						<button
							ref={firstMenuItemRef}
							className={styles.menuItem}
							onClick={handleThemeEdit}
							role="menuitem"
							aria-label="エディタの背景色と文字色を変更"
						>
							テーマ編集
						</button>
						<button
							className={styles.menuItem}
							onClick={handleFileLoad}
							role="menuitem"
							aria-label="テキストファイルを読み込んでエディタに表示"
						>
							読み込み
						</button>
						<button
							className={styles.menuItem}
							onClick={handleExportClick}
							role="menuitem"
							aria-label="エディタの内容をWord文書またはテキストファイルとして保存"
						>
							書き出し
						</button>
						<button
							className={styles.menuItem}
							onClick={handleFullscreenToggle}
							role="menuitem"
							aria-label={
								isFullscreen
									? 'フルスクリーンモードを終了して通常表示に戻す'
									: 'アプリケーションをフルスクリーン表示にする'
							}
							aria-pressed={isFullscreen}
						>
							{isFullscreen ? '通常表示' : 'フルスクリーン'}
						</button>

						{/* 区切り線 */}
						<div className={styles.menuDivider}></div>

						{/* PWAセクション */}
						<div className={styles.pwaSection}>
							<button
								className={`${styles.menuItem} ${styles.pwaToggleButton}`}
								onClick={handlePWASectionToggle}
								role="menuitem"
								aria-label="PWA機能の詳細を表示"
								aria-expanded={showPWASection}
							>
								端末アプリ
								<span className={`${styles.expandIcon} ${showPWASection ? styles.expanded : ''}`}>▼</span>
							</button>

							{showPWASection && (
								<div className={styles.pwaSubmenu}>
									{/* PWAインストールボタン - インストール可能でかつ未インストールの場合のみ表示 */}
									{isInstallable && !isInstalled && (
										<div className={styles.pwaInstallButtonContainer}>
											<button
												className={`${styles.menuItem} ${styles.pwaInstallButton}`}
												onClick={async () => {
													try {
														// PWAインストール処理
														if (window.deferredPrompt) {
															console.log('[PWA] Installing PWA...')
															await window.deferredPrompt.prompt()
															const choiceResult = await window.deferredPrompt.userChoice
															if (choiceResult.outcome === 'accepted') {
																console.log('[PWA] PWAインストールが承認されました')
															} else {
																console.log('[PWA] PWAインストールが拒否されました')
															}
															window.deferredPrompt = null
														} else {
															console.log('[PWA] deferredPrompt not available')
														}
													} catch (error) {
														console.error('[PWA] インストールエラー:', error)
													}
												}}
												role="menuitem"
												aria-label="SPLT EDITORをインストール"
											>
												<span>インストール</span>
											</button>
											{/* PWA状態表示 */}
											<div className={styles.pwaStatusContainer}>
												<PWAStatus detail="minimal" />
											</div>
											{/* デバッグ情報 */}
											<div style={{ fontSize: '0.8rem', color: '#666', marginTop: '8px' }}>
												<div>isInstallable: {isInstallable ? 'true' : 'false'}</div>
												<div>isInstalled: {isInstalled ? 'true' : 'false'}</div>
												<div>deferredPrompt: {window.deferredPrompt ? 'available' : 'not available'}</div>
											</div>
										</div>
									)}

									{isInstalled && (
										<>
											{/* PWAアクションボタン */}
											{isUpdateAvailable && (
												<button
													className={`${styles.menuItem} ${styles.pwaActionButton}`}
													onClick={handleUpdateServiceWorker}
													role="menuitem"
													aria-label="アプリを更新"
												>
													更新を適用
												</button>
											)}

											<button
												className={`${styles.menuItem} ${styles.pwaActionButton}`}
												onClick={handleClearCache}
												role="menuitem"
												aria-label="キャッシュをクリア"
											>
												キャッシュクリア
											</button>

											<button
												className={`${styles.menuItem} ${styles.pwaActionButton}`}
												onClick={handleRequestNotificationPermission}
												role="menuitem"
												aria-label="通知の許可を要求"
											>
												通知を有効化
											</button>

											<button
												className={`${styles.menuItem} ${styles.pwaActionButton}`}
												onClick={handleTestNotification}
												role="menuitem"
												aria-label="テスト通知を送信"
											>
												テスト通知
											</button>
										</>
									)}
								</div>
							)}
						</div>
					</div>,
					document.body
				)}
		</div>
	)
}
