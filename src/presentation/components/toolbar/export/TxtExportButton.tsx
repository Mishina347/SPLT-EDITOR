import { FontFamily } from '@/domain'
import { ExportTxtUseCase } from '../../../../application/preview/usePagination'
import { TxtWriter } from '../../../../infra/plainText/TxtWriter'
import buttonStyles from '../../../shared/Button/Button.module.css'
import { Selector } from '../../../shared/Selector/Selector'
import { isAndroid, isIOS } from '../../../../utils/deviceDetection'
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
					{/* プラットフォーム情報表示 */}
					<div style={{ marginBottom: '10px', fontSize: '0.875rem', color: '#666' }}>
						{isAndroid() && '📱 Android端末:  UTF-8使用可能'}
						{isIOS() && '🍎 iOS端末: UTF-8使用可能'}
						{!isAndroid() && !isIOS() && '💻 デスクトップ:  UTF-8使用可能'}
					</div>

					<div style={{ marginBottom: '10px' }}>
						<Selector
							label="エンコーディング"
							value={selectedEncoding}
							options={[
								{ value: 'utf8', label: 'UTF-8 (推奨)' },
								{ value: 'shift_jis', label: 'Shift_JIS (日本語環境)' },
							]}
							onChange={value => setSelectedEncoding(value as 'utf8' | 'shift_jis')}
						/>
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
