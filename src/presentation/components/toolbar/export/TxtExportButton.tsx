import { useState } from 'react'
import { FontFamily } from '@/domain'
import { ExportTxtUseCase } from '@/application/preview/usePagination'
import { TxtWriter } from '@/infra/plainText/TxtWriter'
import { isAndroid, isIOS } from '@/utils'
import styles from './TxtExportButton.module.css'
import { Selector } from '@/presentation/shared'
import buttonStyles from '@/presentation/shared/Button/Button.module.css'

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
				<div className={styles.encodingOptions}>
					{/* プラットフォーム情報表示 */}
					<div className={styles.platformInfo}>
						{isAndroid() && '📱 Android端末:  UTF-8使用可能'}
						{isIOS() && '🍎 iOS端末: UTF-8使用可能'}
						{!isAndroid() && !isIOS() && '💻 デスクトップ:  UTF-8使用可能'}
					</div>

					<div className={styles.encodingSelector}>
						<div className={styles.exportSelectorContainer}>
							<Selector
								label="エンコーディング"
								value={selectedEncoding}
								options={[
									{ value: 'utf8', label: 'UTF-8 (推奨)' },
									{ value: 'shift_jis', label: 'Shift_JIS (日本語環境)' },
								]}
								ignoreTheme={true}
								onChange={e => setSelectedEncoding(e as 'utf8' | 'shift_jis')}
							/>
						</div>
					</div>
					<div className={styles.buttonGroup}>
						<button
							className={`${buttonStyles.button} ${buttonStyles.buttonSecondary}`}
							onClick={() => setShowEncodingOptions(false)}
						>
							キャンセル
						</button>
						<button
							className={`${buttonStyles.button} ${buttonStyles.buttonPrimary}`}
							onClick={handleExportWithEncoding}
						>
							選択したエンコーディングで出力
						</button>
					</div>
				</div>
			)}
		</div>
	)
}
