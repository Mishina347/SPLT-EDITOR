import React, { useCallback } from 'react'
import { EditorSettings, DISPLAY_MODE, EDITOR_CONSTANTS, FontFamily } from '../../../../domain'
import styles from './editorSettingsPanel.module.css'
import { Counter } from '../../editor/components/Counter/Counter'
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

		// const handleAutoSaveEnabledChange = useCallback(
		// 	(enabled: boolean) => {
		// 		onChange({
		// 			...settings,
		// 			autoSave: { ...settings.autoSave, enabled },
		// 		})
		// 	},
		// 	[settings, onChange]
		// )

		// const handleAutoSaveDelayChange = useCallback(
		// 	(delay: number) => {
		// 		onChange({
		// 			...settings,
		// 			autoSave: { ...settings.autoSave, delay },
		// 		})
		// 	},
		// 	[settings, onChange]
		// )

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

				{/* Auto Save設定 
					<fieldset
						className={styles.autoSaveSection}
						role="group"
						aria-labelledby="autosave-settings-heading"
					>
						<legend id="autosave-settings-heading" className={styles.sectionHeading}>
							自動保存設定
						</legend>
						<label className={styles.checkboxLabel}>
							<input
								type="checkbox"
								checked={settings.autoSave.enabled}
								onChange={e => handleAutoSaveEnabledChange(e.target.checked)}
								onFocus={handleFocus}
								className={styles.checkbox}
								aria-describedby="autosave-enabled-help"
								id="autosave-enabled"
							/>
							自動保存を有効にする
						</label>
						<div id="autosave-enabled-help" className={styles.helpText}>
							文章の編集中に自動的に保存を行います
						</div>
					

						{settings.autoSave.enabled && (
							<NumberStepper
								label="自動保存間隔（分）"
								value={settings.autoSave.delay}
								onChange={minute => handleAutoSaveDelayChange(minute * 1000)}
								onFocus={handleFocus}
								min={1}
								max={60}
								step={1}
								ariaDescribedBy="autosave-delay-help"
								decrementLabel="自動保存間隔を短くする"
								incrementLabel="自動保存間隔を長くする"
							/>
						)}
						{settings.autoSave.enabled && (
							<div id="autosave-delay-help" className={styles.helpText}>
								1分から60分の範囲で設定できます
							</div>
						)}
					</fieldset>
				*/}
			</div>
		)
	}
)
