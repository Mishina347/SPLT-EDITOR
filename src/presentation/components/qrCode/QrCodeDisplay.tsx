import React, { useState, useEffect } from 'react'
import { QrCodeService, QrCodeOptions } from '@/infra/qrCode/QrCodeService'
import styles from './QrCodeDisplay.module.css'

interface QrCodeDisplayProps {
	text: string
	options?: QrCodeOptions
	showControls?: boolean
	onError?: (error: string) => void
}

export const QrCodeDisplay: React.FC<QrCodeDisplayProps> = ({
	text,
	options = {},
	showControls = true,
	onError,
}) => {
	const [qrCodeDataUrl, setQrCodeDataUrl] = useState<string>('')
	const [isLoading, setIsLoading] = useState(false)
	const [error, setError] = useState<string | null>(null)

	const qrCodeService = new QrCodeService()

	// 日本語テキストかどうかを判定
	const isJapanese = /[\u3040-\u309F\u30A0-\u30FF\u4E00-\u9FAF]/.test(text)
	const textLength = text.length

	// 日本語テキストに適した初期設定
	const getInitialOptions = (): QrCodeOptions => {
		if (isJapanese) {
			return {
				width: qrCodeService.getRecommendedSize(textLength),
				margin: 4,
				color: { dark: '#000000', light: '#FFFFFF' },
				errorCorrectionLevel: qrCodeService.getRecommendedErrorCorrectionLevel(textLength),
				...options,
			}
		}
		return {
			width: 256,
			margin: 2,
			color: { dark: '#000000', light: '#FFFFFF' },
			errorCorrectionLevel: 'M',
			...options,
		}
	}

	const [qrOptions, setQrOptions] = useState<QrCodeOptions>(getInitialOptions())

	// QRコードを生成
	const generateQrCode = async () => {
		if (!text.trim()) {
			setError('テキストが空です')
			return
		}

		setIsLoading(true)
		setError(null)

		try {
			const result = await qrCodeService.generateQrCode(text, qrOptions)
			setQrCodeDataUrl(result.dataUrl)
		} catch (err) {
			const errorMessage = err instanceof Error ? err.message : 'QRコード生成に失敗しました'
			setError(errorMessage)
			onError?.(errorMessage)
		} finally {
			setIsLoading(false)
		}
	}

	// テキストが変更されたときにQRコードを再生成
	useEffect(() => {
		if (text.trim()) {
			generateQrCode()
		}
	}, [text, qrOptions])

	// ダウンロード機能
	const handleDownloadPng = async () => {
		try {
			const filename = `qr_code_${Date.now()}`
			await qrCodeService.downloadQrCodeAsPng(text, filename, qrOptions)
		} catch (err) {
			const errorMessage = err instanceof Error ? err.message : 'ダウンロードに失敗しました'
			setError(errorMessage)
			onError?.(errorMessage)
		}
	}

	const handleDownloadSvg = async () => {
		try {
			const filename = `qr_code_${Date.now()}`
			await qrCodeService.downloadQrCodeAsSvg(text, filename, qrOptions)
		} catch (err) {
			const errorMessage = err instanceof Error ? err.message : 'ダウンロードに失敗しました'
			setError(errorMessage)
			onError?.(errorMessage)
		}
	}

	// オプション変更ハンドラー
	const handleSizeChange = (size: number) => {
		setQrOptions(prev => ({ ...prev, width: size }))
	}

	const handleErrorCorrectionChange = (level: 'L' | 'M' | 'Q' | 'H') => {
		setQrOptions(prev => ({ ...prev, errorCorrectionLevel: level }))
	}

	const handleColorChange = (dark: string, light: string) => {
		setQrOptions(prev => ({
			...prev,
			color: { dark, light },
		}))
	}

	return (
		<div className={styles.qrCodeContainer}>
			{showControls && (
				<div className={styles.controls}>
					<div className={styles.controlGroup}>
						<label htmlFor="qr-size" className={styles.label}>
							サイズ
						</label>
						<select
							id="qr-size"
							value={qrOptions.width}
							onChange={e => handleSizeChange(Number(e.target.value))}
							className={styles.select}
						>
							<option value={200}>小 (200px)</option>
							<option value={256}>中 (256px)</option>
							<option value={320}>大 (320px)</option>
							<option value={400}>特大 (400px)</option>
						</select>
					</div>

					<div className={styles.controlGroup}>
						<label htmlFor="qr-error-level" className={styles.label}>
							エラー訂正レベル
						</label>
						<select
							id="qr-error-level"
							value={qrOptions.errorCorrectionLevel}
							onChange={e => handleErrorCorrectionChange(e.target.value as 'L' | 'M' | 'Q' | 'H')}
							className={styles.select}
						>
							<option value="L">L (低)</option>
							<option value="M">M (中)</option>
							<option value="Q">Q (高)</option>
							<option value="H">H (最高)</option>
						</select>
					</div>

					<div className={styles.controlGroup}>
						<label htmlFor="qr-dark-color" className={styles.label}>
							前景色
						</label>
						<input
							id="qr-dark-color"
							type="color"
							value={qrOptions.color?.dark || '#000000'}
							onChange={e => handleColorChange(e.target.value, qrOptions.color?.light || '#FFFFFF')}
							className={styles.colorInput}
						/>
					</div>

					<div className={styles.controlGroup}>
						<label htmlFor="qr-light-color" className={styles.label}>
							背景色
						</label>
						<input
							id="qr-light-color"
							type="color"
							value={qrOptions.color?.light || '#FFFFFF'}
							onChange={e => handleColorChange(qrOptions.color?.dark || '#000000', e.target.value)}
							className={styles.colorInput}
						/>
					</div>
				</div>
			)}

			<div className={styles.qrCodeDisplay}>
				{isLoading && (
					<div className={styles.loading}>
						<div className={styles.spinner}></div>
						<p>QRコードを生成中...</p>
					</div>
				)}

				{error && (
					<div className={styles.error}>
						<p>エラー: {error}</p>
						<button onClick={generateQrCode} className={styles.retryButton}>
							再試行
						</button>
					</div>
				)}

				{qrCodeDataUrl && !isLoading && !error && (
					<div className={styles.qrCodeWrapper}>
						<img src={qrCodeDataUrl} alt="QR Code" className={styles.qrCodeImage} />
						<div className={styles.downloadButtons}>
							<button onClick={handleDownloadPng} className={styles.downloadButton}>
								PNG ダウンロード
							</button>
							<button onClick={handleDownloadSvg} className={styles.downloadButton}>
								SVG ダウンロード
							</button>
						</div>
					</div>
				)}
			</div>

			{text && (
				<div className={styles.textInfo}>
					<p className={styles.textLength}>
						テキスト長: {text.length} 文字
						{isJapanese && text.length > 400 && (
							<span className={styles.warning}>
								⚠️ 日本語テキストが400文字を超えています。QRコードの生成に失敗する可能性があります。
							</span>
						)}
					</p>
					<p className={styles.textPreview}>
						{text.length > 100 ? `${text.substring(0, 100)}...` : text}
					</p>
				</div>
			)}
		</div>
	)
}
