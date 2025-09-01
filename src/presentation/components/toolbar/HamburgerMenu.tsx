import React from 'react'
import { createPortal } from 'react-dom'
import {
	useFullscreen,
	useHamburgerMenu,
	useMenuPosition,
	useMenuKeyboard,
	usePWAMenu,
} from '../../hooks'
import { PWAStatus } from '../pwa/PWAStatus'
import styles from './HamburgerMenu.module.css'

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
	// フルスクリーン機能
	const { isFullscreen, toggleFullscreen } = useFullscreen()

	// HamburgerMenu関連のhooks
	const {
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
	} = useHamburgerMenu({
		onThemeEdit,
		onFileLoad,
		onExportOpen,
	})

	// メニューの位置計算
	const menuPosition = useMenuPosition({
		isOpen,
		showPWASection,
		buttonRef,
	})

	// キーボードナビゲーション
	useMenuKeyboard({
		isOpen,
		menuRef,
		buttonRef,
		firstMenuItemRef,
		onClose: toggleMenu,
	})

	// PWA機能
	const {
		isInstallButtonShow,
		handleUpdateServiceWorker,
		handleClearCache,
		handleRequestNotificationPermission,
		handleTestNotification,
		handlePWAInstall,
	} = usePWAMenu()

	const handleFullscreenToggle = () => {
		toggleFullscreen()
		toggleMenu()
	}

	return (
		<div className={styles.hamburgerContainer} ref={menuRef}>
			<button
				ref={buttonRef}
				className={styles.hamburgerButton}
				onClick={e => toggleMenu(e)}
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
						{isInstallButtonShow && (
							<>
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
											<div className={styles.pwaInstallButtonContainer}>
												<button
													className={`${styles.menuItem} ${styles.pwaInstallButton}`}
													onClick={handlePWAInstall}
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
													<div>isInstallable: {isInstallButtonShow ? 'true' : 'false'}</div>
													<div>isInstalled: {isInstallButtonShow ? 'false' : 'true'}</div>
													<div>deferredPrompt: {window.deferredPrompt ? 'available' : 'not available'}</div>
												</div>
											</div>

											{/* PWAアクションボタン */}
											<button
												className={`${styles.menuItem} ${styles.pwaActionButton}`}
												onClick={handleUpdateServiceWorker}
												role="menuitem"
												aria-label="アプリを更新"
											>
												更新を適用
											</button>

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
										</div>
									)}
								</div>
							</>
						)}
					</div>,
					document.body
				)}
		</div>
	)
}
