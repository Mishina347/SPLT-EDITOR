import React, { useState, useEffect } from 'react'
import styles from './PWAOrientationControl.module.css'

interface PWAOrientationControlProps {
	/** 強制する画面向き */
	forcedOrientation?: 'portrait' | 'landscape' | 'natural'
	/** カスタムクラス名 */
	className?: string
}

export const PWAOrientationControl: React.FC<PWAOrientationControlProps> = ({
	forcedOrientation = 'landscape',
	className = ''
}) => {
	const [currentOrientation, setCurrentOrientation] = useState<string>('')
	const [isSupported, setIsSupported] = useState(false)

	useEffect(() => {
		// 画面向きの変更を監視
		const handleOrientationChange = () => {
			const orientation = window.screen.orientation?.type || 'unknown'
			setCurrentOrientation(orientation)
		}

		// 初期状態を設定
		handleOrientationChange()

		// 画面向きの変更イベントを監視
		window.addEventListener('orientationchange', handleOrientationChange)
		window.screen.orientation?.addEventListener('change', handleOrientationChange)

		// サポート状況をチェック
		setIsSupported(!!window.screen.orientation)

		return () => {
			window.removeEventListener('orientationchange', handleOrientationChange)
			window.screen.orientation?.removeEventListener('change', handleOrientationChange)
		}
	}, [])

	// 画面向きを強制変更
	const forceOrientation = async (orientation: 'portrait' | 'landscape') => {
		if (!isSupported) {
			console.warn('画面向きの制御がサポートされていません')
			return
		}

		try {
			await window.screen.orientation.lock(orientation)
			console.log(`画面向きを${orientation}に固定しました`)
		} catch (error) {
			console.error('画面向きの変更に失敗しました:', error)
		}
	}

	// 画面向きのロックを解除
	const unlockOrientation = async () => {
		if (!isSupported) return

		try {
			window.screen.orientation.unlock()
			console.log('画面向きのロックを解除しました')
		} catch (error) {
			console.error('画面向きのロック解除に失敗しました:', error)
		}
	}

	// 現在の画面向きを取得
	const getOrientationLabel = (orientation: string) => {
		switch (orientation) {
			case 'portrait':
				return '縦向き'
			case 'landscape':
				return '横向き'
			case 'portrait-primary':
				return '縦向き（プライマリ）'
			case 'portrait-secondary':
				return '縦向き（セカンダリ）'
			case 'landscape-primary':
				return '横向き（プライマリ）'
			case 'landscape-secondary':
				return '横向き（セカンダリ）'
			default:
				return '不明'
		}
	}

	const containerClasses = [
		styles.orientationControl,
		className
	].filter(Boolean).join(' ')

	return (
		<div className={containerClasses}>
			<div className={styles.orientationInfo}>
				<h3>画面向き制御</h3>
				<div className={styles.currentOrientation}>
					<span className={styles.label}>現在の向き:</span>
					<span className={styles.value}>
						{getOrientationLabel(currentOrientation)}
					</span>
				</div>
				<div className={styles.supportStatus}>
					<span className={styles.label}>サポート状況:</span>
					<span className={`${styles.value} ${isSupported ? styles.supported : styles.unsupported}`}>
						{isSupported ? '対応' : '非対応'}
					</span>
				</div>
			</div>

			{isSupported && (
				<div className={styles.orientationActions}>
					<button
						className={`${styles.orientationButton} ${styles.landscapeButton}`}
						onClick={() => forceOrientation('landscape')}
						aria-label="横向きに固定"
					>
						<svg className={styles.buttonIcon} viewBox="0 0 24 24" fill="currentColor">
							<path d="M19 12H5v-1h14v1zM19 16H5v-1h14v1zM19 8H5V7h14v1z" />
						</svg>
						横向きに固定
					</button>

					<button
						className={`${styles.orientationButton} ${styles.portraitButton}`}
						onClick={() => forceOrientation('portrait')}
						aria-label="縦向きに固定"
					>
						<svg className={styles.buttonIcon} viewBox="0 0 24 24" fill="currentColor">
							<path d="M12 19V5h1v14h-1zM8 19V5h1v14H8zM16 19V5h1v14h-1z" />
						</svg>
						縦向きに固定
					</button>

					<button
						className={`${styles.orientationButton} ${styles.unlockButton}`}
						onClick={unlockOrientation}
						aria-label="画面向きのロックを解除"
					>
						<svg className={styles.buttonIcon} viewBox="0 0 24 24" fill="currentColor">
							<path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2 15l-5-5 1.41-1.41L10 14.17l7.59-7.59L19 8l-9 9z" />
						</svg>
						ロック解除
					</button>
				</div>
			)}

			{!isSupported && (
				<div className={styles.unsupportedMessage}>
					<p>お使いのブラウザでは画面向きの制御がサポートされていません。</p>
					<p>PWAとしてインストールしてご利用ください。</p>
				</div>
			)}

			<div className={styles.orientationTips}>
				<h4>画面向きのヒント</h4>
				<ul>
					<li><strong>横向き（landscape）</strong>: テキストエディタに最適、より多くのテキストを表示</li>
					<li><strong>縦向き（portrait）</strong>: モバイルデバイスでの入力に最適</li>
					<li><strong>ロック解除</strong>: デバイスの自動回転を有効化</li>
				</ul>
			</div>
		</div>
	)
}
