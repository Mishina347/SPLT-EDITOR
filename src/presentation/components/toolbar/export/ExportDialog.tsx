import React from 'react'
import { Dialog } from '../../../shared'
import { TxtExportButton } from './TxtExportButton'
import { QrCodeExportButton } from './QrCodeExportButton'
import { DocxExportButton } from './DocxExportButton'
import { LayoutConfig } from '../../../../domain/preview/pdf/TextContent'
import { convertTextToManuscript } from '../../../../domain/text/convertTextToManuscript'
import { getFileName } from '@/utils/fileUtils'
import styles from './ExportDialog.module.css'

interface ExportDialogProps {
	isOpen: boolean
	onClose: () => void
	currentSavedText: string
	previewSettings: LayoutConfig
	currentFilePath?: string | null
}

export const ExportDialog: React.FC<ExportDialogProps> = ({
	isOpen,
	onClose,
	currentSavedText,
	previewSettings,
	currentFilePath,
}) => {
	// ファイル名を取得（拡張子を除去）
	const fileName = getFileName(currentFilePath, { removeExtension: true })
	// currentSavedTextをManuscript形式に変換（ファイル名をタイトルとして使用）
	const manuscript = convertTextToManuscript(currentSavedText, fileName)

	return (
		<Dialog
			isOpen={isOpen}
			onClose={onClose}
			title="書き出し形式を選択"
			constrainToContainer={true}
			maxWidth="800px"
			maxHeight="600px"
		>
			<div className={styles.exportDialogContainer}>
				<div onClick={e => e.stopPropagation()}>
					<section className={styles.exportOptions}>
						<div className={styles.exportOption}>
							<div>
								<h4 className={styles.exportTitle}>Word形式 (.docx)</h4>
								<p className={styles.exportDescription}>A4縦向き、横書きで出力します</p>
							</div>
							<DocxExportButton manuscript={manuscript} onExport={onClose} />
						</div>
						<div className={styles.exportOption}>
							<div>
								<h4 className={styles.exportTitle}>QRコード</h4>
								<p className={styles.exportDescription}>テキストをQRコードとして出力します</p>
							</div>
							<QrCodeExportButton text={currentSavedText} onExport={onClose} />
						</div>
						{/* 
							<div className={styles.exportOption}>
								<div>
									<h4 className={styles.exportTitle}>PDF形式 (.pdf)</h4>
									<p className={styles.exportDescription}>縦書き対応のPDFで出力します</p>
								</div>
								<PdfExportButton manuscript={manuscript} />
							</div>
						*/}
						<div className={styles.exportOption}>
							<div>
								<h4 className={styles.exportTitle}>テキスト形式 (.txt)</h4>
								<p className={styles.exportDescription}>.txtで出力します</p>
							</div>
							<TxtExportButton
								text={currentSavedText}
								charsPerLine={previewSettings.charsPerLine}
								linesPerPage={previewSettings.linesPerPage}
								fontSize={previewSettings.fontSize}
								fontFamily={previewSettings.fontFamily}
								onExport={onClose}
							/>
						</div>
					</section>
				</div>
			</div>
		</Dialog>
	)
}
