import { FontFamily } from '@/domain'
import { ExportTxtUseCase } from '../../../../application/preview/usePagination'
import { TxtWriter } from '../../../../infra/plainText/TxtWriter'
import buttonStyles from '../../../shared/Button/Button.module.css'
import { useState } from 'react'

type Props = {
	text: string
	charsPerLine: number
	linesPerPage: number
	fontSize: number
	fontFamily: FontFamily
	onExport?: () => void
}

export function TxtExportButton({
	text,
	charsPerLine,
	linesPerPage,
	fontSize,
	fontFamily,
	onExport,
}: Props) {
	const [showEncodingOptions, setShowEncodingOptions] = useState(false)
	const [selectedEncoding, setSelectedEncoding] = useState<'utf8' | 'shift_jis'>('utf8')

	const handleExport = async () => {
		const usecase = new ExportTxtUseCase(new TxtWriter())
		await usecase.execute(text, { charsPerLine, linesPerPage, fontSize, fontFamily }).then(() => {})
		onExport?.()
	}

	const handleExportWithEncoding = async () => {
		const txtWriter = new TxtWriter()
		// テキストをページ分割してから出力
		// ここでは簡易的に1行ずつ処理
		const lines = text.split('\n')
		const pages = [lines] // 1ページとして扱う

		await txtWriter.writeWithEncoding(pages, selectedEncoding)
		onExport?.()
	}

	return (
		<div>
			<button
				className={`${buttonStyles.button} ${buttonStyles.buttonSecondary}`}
				aria-label="テキストファイルとして文章を出力"
				onClick={() => setShowEncodingOptions(!showEncodingOptions)}
			>
				.txt形式で出力
			</button>

			{showEncodingOptions && (
				<div
					style={{ marginTop: '10px', padding: '10px', border: '1px solid #ccc', borderRadius: '4px' }}
				>
					<div style={{ marginBottom: '10px' }}>
						<label>
							エンコーディング:
							<select
								value={selectedEncoding}
								onChange={e => setSelectedEncoding(e.target.value as 'utf8' | 'shift_jis')}
								style={{ marginLeft: '10px' }}
							>
								<option value="utf8">UTF-8 (推奨)</option>
								<option value="shift_jis">Shift_JIS (日本語環境)</option>
							</select>
						</label>
					</div>
					<div>
						<button
							className={`${buttonStyles.button} ${buttonStyles.buttonSecondary}`}
							onClick={() => setShowEncodingOptions(false)}
						>
							キャンセル
						</button>
						<button
							className={`${buttonStyles.button} ${buttonStyles.buttonPrimary}`}
							onClick={handleExportWithEncoding}
							style={{ marginRight: '10px' }}
						>
							選択したエンコーディングで出力
						</button>
					</div>
				</div>
			)}
		</div>
	)
}
