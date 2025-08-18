import React, { useCallback } from 'react'
import { DISPLAY_MODE, LayoutConfig, PREVIEW_CONSTANTS } from '../../../../domain'
import styles from './previewSettingsPanel.module.css'
import buttonStyles from '../../../shared/Button.module.css'

type Props = {
	settings: LayoutConfig
	onChange: (settings: LayoutConfig) => void
	onToolbarFocusChange: (displayMode: DISPLAY_MODE | null) => void
}

// 定数は EDITOR_CONSTANTS から使用

export const PreviewSettingsPanel = React.memo<Props>(
	({ settings, onChange, onToolbarFocusChange }) => {
		// コールバックを最適化
		const handleCharsPerLineChange = useCallback(
			(e: React.ChangeEvent<HTMLInputElement>) => {
				const charsPerLine = Number(e.target.value)
				onChange({ ...settings, charsPerLine })
			},
			[settings, onChange]
		)

		const handleLinesPerPageChange = useCallback(
			(e: React.ChangeEvent<HTMLInputElement>) => {
				const linesPerPage = Number(e.target.value)
				onChange({ ...settings, linesPerPage })
			},
			[settings, onChange]
		)

		const handleFocus = useCallback(() => {
			onToolbarFocusChange(DISPLAY_MODE.PREVIEW)
		}, [onToolbarFocusChange])

		// ステッパーコントロール用のハンドラー
		const handleCharsPerLineIncrement = useCallback(
			(e: React.MouseEvent | React.KeyboardEvent) => {
				e.preventDefault()
				e.stopPropagation()
				// フォーカスをボタンに留める
				if (e.currentTarget) {
					;(e.currentTarget as HTMLElement).blur()
				}
				const newChars = Math.min(
					settings.charsPerLine + PREVIEW_CONSTANTS.CHARS_PER_LINE.STEP,
					PREVIEW_CONSTANTS.CHARS_PER_LINE.MAX
				)
				onChange({ ...settings, charsPerLine: newChars })
			},
			[settings, onChange]
		)

		const handleCharsPerLineDecrement = useCallback(
			(e: React.MouseEvent | React.KeyboardEvent) => {
				e.preventDefault()
				e.stopPropagation()
				// フォーカスをボタンに留める
				if (e.currentTarget) {
					;(e.currentTarget as HTMLElement).blur()
				}
				const newChars = Math.max(
					settings.charsPerLine - PREVIEW_CONSTANTS.CHARS_PER_LINE.STEP,
					PREVIEW_CONSTANTS.CHARS_PER_LINE.MIN
				)
				onChange({ ...settings, charsPerLine: newChars })
			},
			[settings, onChange]
		)

		const handleLinesPerPageIncrement = useCallback(
			(e: React.MouseEvent | React.KeyboardEvent) => {
				e.preventDefault()
				e.stopPropagation()
				// フォーカスをボタンに留める
				if (e.currentTarget) {
					;(e.currentTarget as HTMLElement).blur()
				}
				const newLines = Math.min(
					settings.linesPerPage + PREVIEW_CONSTANTS.LINES_PER_PAGE.STEP,
					PREVIEW_CONSTANTS.LINES_PER_PAGE.MAX
				)
				onChange({ ...settings, linesPerPage: newLines })
			},
			[settings, onChange]
		)

		const handleLinesPerPageDecrement = useCallback(
			(e: React.MouseEvent | React.KeyboardEvent) => {
				e.preventDefault()
				e.stopPropagation()
				// フォーカスをボタンに留める
				if (e.currentTarget) {
					;(e.currentTarget as HTMLElement).blur()
				}
				const newLines = Math.max(
					settings.linesPerPage - PREVIEW_CONSTANTS.LINES_PER_PAGE.STEP,
					PREVIEW_CONSTANTS.LINES_PER_PAGE.MIN
				)
				onChange({ ...settings, linesPerPage: newLines })
			},
			[settings, onChange]
		)

		// キーボードナビゲーション用のハンドラー
		const handleKeyDown = useCallback(
			(e: React.KeyboardEvent<HTMLInputElement>, type: 'charsPerLine' | 'linesPerPage') => {
				if (e.key === 'ArrowUp') {
					e.preventDefault()
					if (type === 'charsPerLine') {
						handleCharsPerLineIncrement(e)
					} else {
						handleLinesPerPageIncrement(e)
					}
				} else if (e.key === 'ArrowDown') {
					e.preventDefault()
					if (type === 'charsPerLine') {
						handleCharsPerLineDecrement(e)
					} else {
						handleLinesPerPageDecrement(e)
					}
				}
			},
			[
				handleCharsPerLineIncrement,
				handleCharsPerLineDecrement,
				handleLinesPerPageIncrement,
				handleLinesPerPageDecrement,
			]
		)

		return (
			<div className={styles.container} role="group" aria-labelledby="preview-settings-heading">
				<div className={styles.fieldGroup}>
					<label className={styles.label}>一行あたりの文字数</label>
					<div className={styles.inputGroup}>
						<button
							className={`${buttonStyles.stepperButton} ${buttonStyles.decrement}`}
							onClick={handleCharsPerLineDecrement}
							aria-label="一行あたりの文字数を減らす"
							type="button"
						>
							−
						</button>
						<input
							type="number"
							value={settings.charsPerLine}
							onChange={handleCharsPerLineChange}
							onKeyDown={e => handleKeyDown(e, 'charsPerLine')}
							className={styles.input}
							onFocus={handleFocus}
							min={PREVIEW_CONSTANTS.CHARS_PER_LINE.MIN}
							max={PREVIEW_CONSTANTS.CHARS_PER_LINE.MAX}
							step={PREVIEW_CONSTANTS.CHARS_PER_LINE.STEP}
							aria-label="一行あたりの文字数"
							aria-describedby="chars-per-line-help"
							role="spinbutton"
						/>
						<button
							className={`${buttonStyles.stepperButton} ${buttonStyles.increment}`}
							onClick={handleCharsPerLineIncrement}
							aria-label="一行あたりの文字数を増やす"
							type="button"
						>
							＋
						</button>
					</div>
				</div>

				<div className={styles.fieldGroup}>
					<label className={styles.label}>一ページあたりの行数</label>
					<div className={styles.inputGroup}>
						<button
							className={`${buttonStyles.stepperButton} ${buttonStyles.decrement}`}
							onClick={handleLinesPerPageDecrement}
							aria-label="一ページあたりの行数を減らす"
							type="button"
						>
							−
						</button>
						<input
							type="number"
							value={settings.linesPerPage}
							onChange={handleLinesPerPageChange}
							onKeyDown={e => handleKeyDown(e, 'linesPerPage')}
							className={styles.input}
							onFocus={handleFocus}
							min={PREVIEW_CONSTANTS.LINES_PER_PAGE.MIN}
							max={PREVIEW_CONSTANTS.LINES_PER_PAGE.MAX}
							step={PREVIEW_CONSTANTS.LINES_PER_PAGE.STEP}
							aria-label="一ページあたりの行数"
							aria-describedby="lines-per-page-help"
							role="spinbutton"
						/>
						<button
							className={`${buttonStyles.stepperButton} ${buttonStyles.increment}`}
							onClick={handleLinesPerPageIncrement}
							aria-label="一ページあたりの行数を増やす"
							type="button"
						>
							＋
						</button>
					</div>
				</div>
			</div>
		)
	}
)
