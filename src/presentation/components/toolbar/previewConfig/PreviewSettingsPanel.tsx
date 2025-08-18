import React, { useCallback } from 'react'
import { DISPLAY_MODE, LayoutConfig, PREVIEW_CONSTANTS } from '../../../../domain'
import styles from './previewSettingsPanel.module.css'
import { NumberStepper } from '../../'

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
			(charsPerLine: number) => {
				onChange({ ...settings, charsPerLine })
			},
			[settings, onChange]
		)

		const handleLinesPerPageChange = useCallback(
			(linesPerPage: number) => {
				onChange({ ...settings, linesPerPage })
			},
			[settings, onChange]
		)

		const handleFocus = useCallback(() => {
			onToolbarFocusChange(DISPLAY_MODE.PREVIEW)
		}, [onToolbarFocusChange])

		return (
			<div className={styles.container} role="group" aria-labelledby="preview-settings-heading">
				<NumberStepper
					label="一行あたりの文字数"
					value={settings.charsPerLine}
					onChange={handleCharsPerLineChange}
					onFocus={handleFocus}
					min={PREVIEW_CONSTANTS.CHARS_PER_LINE.MIN}
					max={PREVIEW_CONSTANTS.CHARS_PER_LINE.MAX}
					step={PREVIEW_CONSTANTS.CHARS_PER_LINE.STEP}
					ariaDescribedBy="chars-per-line-help"
					decrementLabel="一行あたりの文字数を減らす"
					incrementLabel="一行あたりの文字数を増やす"
				/>

				<NumberStepper
					label="一ページあたりの行数"
					value={settings.linesPerPage}
					onChange={handleLinesPerPageChange}
					onFocus={handleFocus}
					min={PREVIEW_CONSTANTS.LINES_PER_PAGE.MIN}
					max={PREVIEW_CONSTANTS.LINES_PER_PAGE.MAX}
					step={PREVIEW_CONSTANTS.LINES_PER_PAGE.STEP}
					ariaDescribedBy="lines-per-page-help"
					decrementLabel="一ページあたりの行数を減らす"
					incrementLabel="一ページあたりの行数を増やす"
				/>
			</div>
		)
	}
)
