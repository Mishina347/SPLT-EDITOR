import React from 'react'
import { usePWA } from '../../hooks/usePWA'
import styles from './PWAStatus.module.css'

interface PWAStatusProps {
	/** 表示する情報の詳細度 */
	detail?: 'minimal' | 'detailed'
	/** カスタムクラス名 */
	className?: string
}

export const PWAStatus: React.FC<PWAStatusProps> = ({ detail = 'minimal', className = '' }) => {
	const {
		isInstallable,
		isInstalled,
		isOffline,
		isUpdateAvailable,
		updateVersion,
		updateServiceWorker,
		clearCache,
		requestNotificationPermission,
		sendNotification,
	} = usePWA()

	const containerClasses = [styles.pwaStatus, className].filter(Boolean).join(' ')

	// 詳細表示の場合
	if (detail === 'detailed') {
		return (
			<div className={containerClasses}>
				<div className={styles.statusGrid}>
					{/* インストール状態 */}
					<div className={styles.statusItem}>
						<span className={styles.label}>インストール状態:</span>
						<span className={`${styles.value} ${isInstalled ? styles.installed : styles.notInstalled}`}>
							{isInstalled ? 'インストール済み' : '未インストール'}
						</span>
					</div>

					{/* インストール可能性 */}
					{!isInstalled && (
						<div className={styles.statusItem}>
							<span className={styles.label}>インストール可能:</span>
							<span className={`${styles.value} ${isInstallable ? styles.available : styles.unavailable}`}>
								{isInstallable ? '可能' : '不可能'}
							</span>
						</div>
					)}

					{/* オンライン状態 */}
					<div className={styles.statusItem}>
						<span className={styles.label}>オンライン状態:</span>
						<span className={`${styles.value} ${isOffline ? styles.offline : styles.online}`}>
							{isOffline ? 'オフライン' : 'オンライン'}
						</span>
					</div>

					{/* 更新状態 */}
					{isUpdateAvailable && (
						<div className={styles.statusItem}>
							<span className={styles.label}>更新:</span>
							<span className={`${styles.value} ${styles.updateAvailable}`}>{updateVersion}</span>
						</div>
					)}
				</div>

				{/* アクションボタン */}
				<div className={styles.actions}>
					{isUpdateAvailable && (
						<button
							className={`${styles.actionButton} ${styles.updateButton}`}
							onClick={updateServiceWorker}
							aria-label="アプリを更新"
						>
							更新を適用
						</button>
					)}

					<button
						className={`${styles.actionButton} ${styles.cacheButton}`}
						onClick={clearCache}
						aria-label="キャッシュをクリア"
					>
						キャッシュクリア
					</button>

					<button
						className={`${styles.actionButton} ${styles.notificationButton}`}
						onClick={requestNotificationPermission}
						aria-label="通知の許可を要求"
					>
						通知を有効化
					</button>

					<button
						className={`${styles.actionButton} ${styles.testNotificationButton}`}
						onClick={() => sendNotification('テスト通知', { body: 'PWA通知が正常に動作しています' })}
						aria-label="テスト通知を送信"
					>
						テスト通知
					</button>
				</div>
			</div>
		)
	}

	// 最小表示の場合
	return (
		<div className={containerClasses}>
			{/* オフライン状態の表示 */}
			{isOffline && (
				<div className={`${styles.statusBadge} ${styles.offlineBadge}`}>
					<svg className={styles.badgeIcon} viewBox="0 0 24 24" fill="currentColor">
						<path d="M24 8.98C20.93 5.9 16.69 4 12 4C7.31 4 3.07 5.9 0 8.98L12 21L24 8.98ZM2.92 9.07C5.51 7.08 8.67 6 12 6C15.33 6 18.49 7.08 21.08 9.07L12 18.17L2.92 9.07Z" />
					</svg>
					オフライン
				</div>
			)}

			{/* 更新可能状態の表示 */}
			{isUpdateAvailable && (
				<div className={`${styles.statusBadge} ${styles.updateBadge}`}>
					<svg className={styles.badgeIcon} viewBox="0 0 24 24" fill="currentColor">
						<path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2 15l-5-5 1.41-1.41L10 14.17l7.59-7.59L19 8l-9 9z" />
					</svg>
					更新可能
				</div>
			)}

			{/* インストール済み状態の表示 */}
			{isInstalled && (
				<div className={`${styles.statusBadge} ${styles.installedBadge}`}>
					<svg className={styles.badgeIcon} viewBox="0 0 24 24" fill="currentColor">
						<path d="M9 16.17L4.83 12l-1.42 1.41L9 19 21 7l-1.41-1.41z" />
					</svg>
					インストール済み
				</div>
			)}
		</div>
	)
}
