import React, { useState } from 'react'
import { usePWA } from '../../hooks/usePWA'
import styles from './PWAInstallButton.module.css'

interface PWAInstallButtonProps {
	/** ボタンのサイズ */
	size?: 'small' | 'medium' | 'large'
	/** ボタンのスタイル */
	variant?: 'primary' | 'secondary' | 'outline'
	/** カスタムクラス名 */
	className?: string
	/** インストールプロンプトのタイトル */
	installTitle?: string
	/** インストールプロンプトの説明 */
	installDescription?: string
	/** インストールプロンプトのアイコン */
	installIcon?: string
}

export const PWAInstallButton: React.FC<PWAInstallButtonProps> = ({
	installTitle = 'SPLT EDITORをインストール',
	installDescription = 'ホーム画面に追加して、より快適に使用できます',
	installIcon = '/SPLT-EDITOR/icons/icon-96x96.png',
}) => {
	const { isInstallable, isInstalled, isOffline, installPWA } = usePWA()

	const [isInstalling, setIsInstalling] = useState(false)
	const [error, setError] = useState<string | null>(null)

	// インストール処理
	const handleInstall = async () => {
		if (!isInstallable || isInstalling) return

		setIsInstalling(true)
		setError(null)

		try {
			await installPWA({
				title: installTitle,
				description: installDescription,
				icon: installIcon,
			})
		} catch (err) {
			setError(err instanceof Error ? err.message : 'インストールに失敗しました')
			console.error('PWA installation failed:', err)
		} finally {
			setIsInstalling(false)
		}
	}

	// インストール済みまたはインストール不可能な場合は表示しない
	if (isInstalled || !isInstallable) {
		return null
	}

	// オフライン時は表示しない
	if (isOffline) {
		return null
	}

	return (
		<div className={styles.container}>
			<button
				className={styles.pwaInstallButton}
				onClick={handleInstall}
				disabled={isInstalling}
				aria-label="アプリをインストール"
				title="ホーム画面に追加"
			>
				{isInstalling ? (
					<>
						<span className={styles.spinner}></span>
						インストール中...
					</>
				) : (
					<>
						<svg className={styles.icon} viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
							<path d="M19 9h-4V3H9v6H5l7 7 7-7zM5 18v2h14v-2H5z" />
						</svg>
						インストール
					</>
				)}
			</button>

			{error && (
				<div className={styles.error} role="alert">
					{error}
				</div>
			)}
		</div>
	)
}
