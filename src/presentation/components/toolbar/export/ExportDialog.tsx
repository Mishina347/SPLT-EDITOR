import React from 'react'
import { Dialog } from '../../../shared/Dialog/Dialog'
import { TxtExportButton } from './TxtExportButton'
import { DocxExportButton } from './DocxExportButton'
import { LayoutConfig } from '../../../../domain/preview/pdf/TextContent'
import styles from './ExportDialog.module.css'

interface ExportDialogProps {
	isOpen: boolean
	onClose: () => void
	currentSavedText: string
	previewSettings: LayoutConfig
}

export const ExportDialog: React.FC<ExportDialogProps> = ({
	isOpen,
	onClose,
	currentSavedText,
	previewSettings,
}) => {
	return (
		<Dialog
			isOpen={isOpen}
			onClose={onClose}
			title="書き出し形式を選択"
			constrainToContainer={true}
			maxWidth="800px"
			maxHeight="600px"
		>
			<div onClick={e => e.stopPropagation()}>
				<section className={styles.exportOptions}>
					<div className={styles.exportOption}>
						<div>
							<h4 className={styles.exportTitle}>テキスト形式 (.txt)</h4>
							<p className={styles.exportDescription}>.txtで出力します</p>
						</div>
						<TxtExportButton
							text={currentSavedText}
							charsPerLine={previewSettings.charsPerLine}
							linesPerPage={previewSettings.linesPerPage}
							onExport={onClose}
						/>
					</div>
					<div className={styles.exportOption}>
						<div>
							<h4 className={styles.exportTitle}>Word形式 (.docx)</h4>
							<p className={styles.exportDescription}>Word形式で出力します</p>
						</div>
						<DocxExportButton currentSavedText={currentSavedText} onExport={onClose} />
					</div>
				</section>
			</div>
		</Dialog>
	)
}
