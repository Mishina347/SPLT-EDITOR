import { useState } from 'react'
import { FontFamily } from '@/domain'
import { TxtWriter } from '@/infra/plainText/TxtWriter'
import { isAndroid, isIOS } from '@/utils'
import {
	validateFilename,
	sanitizeFilename,
	generateDefaultFilename,
} from '@/utils/filenameValidation'
import styles from './TxtExportButton.module.css'
import { Selector } from '@/presentation/shared'
import buttonStyles from '@/presentation/shared/Button/Button.module.css'

// テキストからデフォルトファイル名を生成する関数（トップレベル）
function generateDefaultFilenameFromText(text: string): string {
	if (!text || text.trim() === '') {
		return generateDefaultFilename()
	}

	// テキストの最初の行を取得（タイトルとして使用）
	const firstLine = text.split('\n')[0].trim()
	if (firstLine && firstLine.length > 0) {
		// 最初の行をサニタイズしてファイル名として使用
		const sanitizedTitle = sanitizeFilename(firstLine)
		// 長すぎる場合は切り詰める
		const truncatedTitle =
			sanitizedTitle.length > 50 ? sanitizedTitle.substring(0, 50) : sanitizedTitle
		return truncatedTitle + '.txt'
	}

	return generateDefaultFilename()
}

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
	const [filename, setFilename] = useState(() => generateDefaultFilenameFromText(text))
	const [filenameError, setFilenameError] = useState<string | null>(null)

	const handleFilenameChange = (newFilename: string) => {
		setFilename(newFilename)

		// リアルタイムバリデーション（エラー表示のみ、自動更新はしない）
		const validation = validateFilename(newFilename)
		if (!validation.isValid) {
			setFilenameError(validation.error || '無効なファイル名です')
		} else {
			setFilenameError(null)
		}
	}

	const handleExportWithEncoding = async () => {
		// 最終バリデーション
		const validation = validateFilename(filename)
		if (!validation.isValid) {
			setFilenameError(validation.error || '無効なファイル名です')
			return
		}

		const finalFilename = validation.suggestedFilename || filename

		const txtWriter = new TxtWriter()
		// テキストをページ分割してから出力
		// ここでは簡易的に1行ずつ処理
		const lines = text.split('\n')
		const pages = [lines] // 1ページとして扱う

		await txtWriter.writeWithEncoding(pages, selectedEncoding, finalFilename)
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

					{/* ファイル名入力フィールド */}
					<div className={styles.filenameInput}>
						<div className={styles.filenameHeader}>
							<label htmlFor="txt-filename" className={styles.filenameLabel}>
								ファイル名
							</label>
						</div>
						<input
							id="txt-filename"
							type="text"
							value={filename}
							onChange={e => handleFilenameChange(e.target.value)}
							placeholder="document.txt"
							className={`${styles.filenameField} ${filenameError ? styles.filenameFieldError : ''}`}
						/>
						{filenameError && <div className={styles.filenameError}>{filenameError}</div>}
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
							disabled={!!filenameError}
						>
							選択したエンコーディングで出力
						</button>
					</div>
				</div>
			)}
		</div>
	)
}
