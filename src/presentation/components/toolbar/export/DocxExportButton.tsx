import React from 'react'
import {
	Manuscript,
	DocxExportSettings,
	DEFAULT_DOCX_SETTINGS,
	convertTextToManuscript,
} from '../../../../domain'
import { DocxExporter } from '../../../../infra'
import { ExportManuscriptAsDocx } from '../../../../usecases'
import { ExportManuscriptController } from '../../../../adapters'
import buttonStyles from '../../../shared/Button/Button.module.css'

interface DocxExportButtonProps {
	currentSavedText: string
	settings?: DocxExportSettings
	onExport?: () => void
}

export const DocxExportButton: React.FC<DocxExportButtonProps> = ({
	currentSavedText,
	settings = DEFAULT_DOCX_SETTINGS,
	onExport,
}) => {
	const handleExport = () => {
		// currentSavedTextをManuscript形式に変換
		const manuscript = convertTextToManuscript(currentSavedText)

		const exporter = new DocxExporter(settings)
		const usecase = new ExportManuscriptAsDocx(exporter)
		const controller = new ExportManuscriptController(usecase)
		controller.handle(manuscript)
		onExport?.()
	}

	return (
		<button
			className={`${buttonStyles.button} ${buttonStyles.buttonSecondary}`}
			aria-label="docxファイルとして文章を出力"
			onClick={handleExport}
		>
			Word形式で出力
		</button>
	)
}
