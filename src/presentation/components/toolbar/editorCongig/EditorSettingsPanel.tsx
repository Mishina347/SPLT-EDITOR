import React, { useCallback } from 'react'
import { EditorSettings, DISPLAY_MODE, EDITOR_CONSTANTS, FontFamily } from '../../../../domain'
import styles from './editorSettingsPanel.module.css'
import { Counter } from '../../editor/Counter'
import { NumberStepper, FontSelector } from '../../'

type Props = {
	settings: EditorSettings
	text: string
	onChange: (settings: EditorSettings) => void
	onToolbarFocusChange: (displayMode: DISPLAY_MODE) => void
}

// 定数は EDITOR_CONSTANTS から使用

export const EditorSettingsPanel = React.memo<Props>(
	({ settings, onChange, onToolbarFocusChange, text }) => {
		// コールバックを最適化
		const handleFontSizeChange = useCallback(
			(fontSize: number) => {
				onChange({ ...settings, fontSize })
			},
			[settings, onChange]
		)

		const handleWordWrapChange = useCallback(
			(wordWrapColumn: number) => {
				onChange({ ...settings, wordWrapColumn })
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
			onToolbarFocusChange(DISPLAY_MODE.EDITOR)
		}, [onToolbarFocusChange])

		return (
			<div className={styles.container} role="group" aria-labelledby="editor-settings-heading">
				<div id="editor-settings-heading" className={styles.srOnly}>
					エディター設定
				</div>
				<FontSelector
					label="フォント"
					value={settings.fontFamily}
					onChange={handleFontFamilyChange}
					onFocus={handleFocus}
					id="font-family-select"
					ariaLabel="フォントファミリーを選択する"
				/>

				<NumberStepper
					label="文字サイズ"
					value={settings.fontSize}
					onChange={handleFontSizeChange}
					onFocus={handleFocus}
					min={EDITOR_CONSTANTS.FONT_SIZE.MIN}
					max={EDITOR_CONSTANTS.FONT_SIZE.MAX}
					step={EDITOR_CONSTANTS.FONT_SIZE.STEP}
					ariaDescribedBy="font-size-help"
					decrementLabel="文字サイズを小さくする"
					incrementLabel="文字サイズを大きくする"
				/>

				<NumberStepper
					label="一行あたりの文字数"
					value={settings.wordWrapColumn}
					onChange={handleWordWrapChange}
					onFocus={handleFocus}
					min={EDITOR_CONSTANTS.CHARS_PER_LINE.MIN}
					max={EDITOR_CONSTANTS.CHARS_PER_LINE.MAX}
					step={EDITOR_CONSTANTS.CHARS_PER_LINE.STEP}
					ariaDescribedBy="word-wrap-help"
					decrementLabel="一行あたりの文字数を減らす"
					incrementLabel="文字数を増やす"
				/>
				<Counter text={text} />
			</div>
		)
	}
)
