import React, { useState } from 'react'
import { QrCodeDisplay } from '@/presentation/components/qrCode/QrCodeDisplay'
import { QrCodeService } from '@/infra/qrCode/QrCodeService'
import styles from './QrCodeExportButton.module.css'
import buttonStyles from '@/presentation/shared/Button/Button.module.css'

interface QrCodeExportButtonProps {
	text: string
	onExport?: () => void
}

export const QrCodeExportButton: React.FC<QrCodeExportButtonProps> = ({
	text,
	onExport,
}) => {
	const [showQrCode, setShowQrCode] = useState(false)
	const [error, setError] = useState<string | null>(null)

	const handleError = (errorMessage: string) => {
		setError(errorMessage)
		console.error('QRコードエラー:', errorMessage)
	}

	const handleClose = () => {
		setShowQrCode(false)
		setError(null)
		onExport?.()
	}

	return (
		<div>
			<button
				className={`${buttonStyles.button} ${buttonStyles.buttonSecondary}`}
				aria-label="QRコードとして文章を出力"
				onClick={() => setShowQrCode(true)}
			>
				QRコードで出力
			</button>

			{showQrCode && (
				<div className={styles.qrCodeModal}>
					<div className={styles.qrCodeModalContent}>
						<div className={styles.qrCodeModalHeader}>
							<h3>QRコード出力</h3>
							<button
								className={styles.closeButton}
								onClick={handleClose}
								aria-label="閉じる"
							>
								×
							</button>
						</div>
						
						<div className={styles.qrCodeModalBody}>
							{error && (
								<div className={styles.errorMessage}>
									<p>エラー: {error}</p>
								</div>
							)}
							
							<QrCodeDisplay
								text={text}
								showControls={true}
								onError={handleError}
							/>
						</div>
						
						<div className={styles.qrCodeModalFooter}>
							<button
								className={`${buttonStyles.button} ${buttonStyles.buttonSecondary}`}
								onClick={handleClose}
							>
								閉じる
							</button>
						</div>
					</div>
				</div>
			)}
		</div>
	)
}
