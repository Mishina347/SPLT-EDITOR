import { ExportTxtUseCase } from '../../../../application/preview/usePagination'
import { TxtWriter } from '../../../../infra/plainText/TxtWriter'
import buttonStyles from '../../../shared/Button.module.css'

type Props = {
	text: string
	charsPerLine: number
	linesPerPage: number
	onExport?: () => void
}

export function TxtExportButton({ text, charsPerLine, linesPerPage, onExport }: Props) {
	const handleExport = async () => {
		const usecase = new ExportTxtUseCase(new TxtWriter())
		await usecase.execute(text, { charsPerLine, linesPerPage }).then(() => {})
		onExport?.()
	}

	return (
		<button
			className={`${buttonStyles.button} ${buttonStyles.buttonSecondary}`}
			aria-label="テキストファイルとして文章を出力"
			onClick={() => handleExport()}
		>
			.txt形式で出力
		</button>
	)
}
