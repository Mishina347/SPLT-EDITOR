import React, { useCallback } from 'react'
import {
	DISPLAY_MODE,
	LayoutConfig,
	PREVIEW_CONSTANTS,
	FontFamily,
	FONT_FAMILIES,
} from '../../../../domain'
import styles from './previewSettingsPanel.module.css'
import { NumberStepper, FontSelector } from '../../'

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

		const handleFontSizeChange = useCallback(
			(fontSize: number) => {
				onChange({ ...settings, fontSize })
			},
			[settings, onChange]
		)

		const handleFontFamilyChange = useCallback(
			(fontFamily: FontFamily) => {
				onChange({ ...settings, fontFamily })
			},
			[settings, onChange]
		)

		const handleFocus = useCallback(() => {
			onToolbarFocusChange(DISPLAY_MODE.PREVIEW)
		}, [onToolbarFocusChange])

		return (
			<div className={styles.container} role="group" aria-labelledby="preview-settings-heading">
				<div id="preview-settings-heading" className={styles.srOnly}>
					プレビュー設定
				</div>

				<FontSelector
					label="フォント"
					value={settings.fontFamily || FONT_FAMILIES.UD_DIGITAL}
					onChange={handleFontFamilyChange}
					onFocus={handleFocus}
					id="preview-font-family-select"
					ariaLabel="プレビュー用のフォントファミリーを選択する"
				/>

				<NumberStepper
					label="文字サイズ"
					value={settings.fontSize || 16}
					onChange={handleFontSizeChange}
					onFocus={handleFocus}
					min={8}
					max={32}
					step={2}
					ariaDescribedBy="preview-font-size-help"
					decrementLabel="プレビューの文字サイズを小さくする"
					incrementLabel="プレビューの文字サイズを大きくする"
				/>

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
