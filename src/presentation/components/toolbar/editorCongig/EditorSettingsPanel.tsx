import React, { useCallback } from 'react'
import {
	EditorSettings,
	DISPLAY_MODE,
	EDITOR_CONSTANTS,
	FONT_FAMILIES,
	FONT_LABELS,
	FontFamily,
} from '../../../../domain'
import styles from './editorSettingsPanel.module.css'
import buttonStyles from '../../../shared/Button.module.css'
import { Counter } from '../../editor/Counter'

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
			(e: React.ChangeEvent<HTMLInputElement>) => {
				const fontSize = Number(e.target.value)
				onChange({ ...settings, fontSize })
			},
			[settings, onChange]
		)

		const handleWordWrapChange = useCallback(
			(e: React.ChangeEvent<HTMLInputElement>) => {
				const wordWrapColumn = Number(e.target.value)
				onChange({ ...settings, wordWrapColumn })
			},
			[settings, onChange]
		)

		const handleFontFamilyChange = useCallback(
			(e: React.ChangeEvent<HTMLSelectElement>) => {
				const fontFamily = e.target.value as FontFamily
				onChange({ ...settings, fontFamily })
			},
			[settings, onChange]
		)

		const handleFocus = useCallback(() => {
			onToolbarFocusChange(DISPLAY_MODE.EDITOR)
		}, [onToolbarFocusChange])

		// ステッパーコントロール用のハンドラー
		const handleFontSizeIncrement = useCallback(
			(e: React.MouseEvent | React.KeyboardEvent) => {
				e.preventDefault()
				e.stopPropagation()
				// フォーカスをボタンに留める
				if (e.currentTarget) {
					;(e.currentTarget as HTMLElement).blur()
				}
				const newSize = Math.min(
					settings.fontSize + EDITOR_CONSTANTS.FONT_SIZE.STEP,
					EDITOR_CONSTANTS.FONT_SIZE.MAX
				)
				onChange({ ...settings, fontSize: newSize })
			},
			[settings, onChange]
		)

		const handleFontSizeDecrement = useCallback(
			(e: React.MouseEvent | React.KeyboardEvent) => {
				e.preventDefault()
				e.stopPropagation()
				// フォーカスをボタンに留める
				if (e.currentTarget) {
					;(e.currentTarget as HTMLElement).blur()
				}
				const newSize = Math.max(
					settings.fontSize - EDITOR_CONSTANTS.FONT_SIZE.STEP,
					EDITOR_CONSTANTS.FONT_SIZE.MIN
				)
				onChange({ ...settings, fontSize: newSize })
			},
			[settings, onChange]
		)

		const handleWordWrapIncrement = useCallback(
			(e: React.MouseEvent | React.KeyboardEvent) => {
				e.preventDefault()
				e.stopPropagation()
				// フォーカスをボタンに留める
				if (e.currentTarget) {
					;(e.currentTarget as HTMLElement).blur()
				}
				const newColumn = Math.min(
					settings.wordWrapColumn + EDITOR_CONSTANTS.CHARS_PER_LINE.STEP,
					EDITOR_CONSTANTS.CHARS_PER_LINE.MAX
				)
				onChange({ ...settings, wordWrapColumn: newColumn })
			},
			[settings, onChange]
		)

		const handleWordWrapDecrement = useCallback(
			(e: React.MouseEvent | React.KeyboardEvent) => {
				e.preventDefault()
				e.stopPropagation()
				// フォーカスをボタンに留める
				if (e.currentTarget) {
					;(e.currentTarget as HTMLElement).blur()
				}
				const newColumn = Math.max(
					settings.wordWrapColumn - EDITOR_CONSTANTS.CHARS_PER_LINE.STEP,
					EDITOR_CONSTANTS.CHARS_PER_LINE.MIN
				)
				onChange({ ...settings, wordWrapColumn: newColumn })
			},
			[settings, onChange]
		)

		// キーボードナビゲーション用のハンドラー
		const handleKeyDown = useCallback(
			(e: React.KeyboardEvent<HTMLInputElement>, type: 'fontSize' | 'wordWrap') => {
				if (e.key === 'ArrowUp') {
					e.preventDefault()
					if (type === 'fontSize') {
						handleFontSizeIncrement(e)
					} else {
						handleWordWrapIncrement(e)
					}
				} else if (e.key === 'ArrowDown') {
					e.preventDefault()
					if (type === 'fontSize') {
						handleFontSizeDecrement(e)
					} else {
						handleWordWrapDecrement(e)
					}
				}
			},
			[
				handleFontSizeIncrement,
				handleFontSizeDecrement,
				handleWordWrapIncrement,
				handleWordWrapDecrement,
			]
		)

		return (
			<div className={styles.container} role="group" aria-labelledby="editor-settings-heading">
				<div id="editor-settings-heading" className={styles.srOnly}>
					エディター設定
				</div>
				<div className={styles.fieldGroup}>
					<label className={styles.label} htmlFor="font-family-select">
						フォント
					</label>
					<div className={styles.inputGroup}>
						<select
							id="font-family-select"
							value={settings.fontFamily}
							onChange={handleFontFamilyChange}
							onFocus={handleFocus}
							className={styles.select}
							aria-label="フォントファミリーを選択する"
						>
							<option value={FONT_FAMILIES.UD_DIGITAL}>{FONT_LABELS.UD_DIGITAL}</option>
							<option value={FONT_FAMILIES.NOTO_SERIF}>{FONT_LABELS.NOTO_SERIF}</option>
						</select>
					</div>
				</div>

				<div className={styles.fieldGroup}>
					<label className={styles.label}>文字サイズ</label>
					<div className={styles.inputGroup}>
						<></>
						<button
							className={`${buttonStyles.stepperButton} ${buttonStyles.decrement}`}
							onClick={handleFontSizeDecrement}
							aria-label="文字サイズを小さくする"
							type="button"
						>
							−
						</button>
						<input
							type="number"
							value={settings.fontSize}
							onChange={handleFontSizeChange}
							onKeyDown={e => handleKeyDown(e, 'fontSize')}
							className={styles.input}
							onFocus={handleFocus}
							min={EDITOR_CONSTANTS.FONT_SIZE.MIN}
							max={EDITOR_CONSTANTS.FONT_SIZE.MAX}
							step={EDITOR_CONSTANTS.FONT_SIZE.STEP}
							aria-label="文字サイズ"
							aria-describedby="font-size-help"
							role="spinbutton"
						/>
						<button
							className={`${buttonStyles.stepperButton} ${buttonStyles.increment}`}
							onClick={handleFontSizeIncrement}
							aria-label="文字サイズを大きくする"
							type="button"
						>
							＋
						</button>
					</div>
				</div>

				<div className={styles.fieldGroup}>
					<label className={styles.label}>一行あたりの文字数</label>
					<div className={styles.inputGroup}>
						<button
							className={`${buttonStyles.stepperButton} ${buttonStyles.decrement}`}
							onClick={handleWordWrapDecrement}
							aria-label="文字数を減らす"
							type="button"
						>
							−
						</button>
						<input
							type="number"
							value={settings.wordWrapColumn}
							onChange={handleWordWrapChange}
							onKeyDown={e => handleKeyDown(e, 'wordWrap')}
							className={styles.input}
							onFocus={handleFocus}
							min={EDITOR_CONSTANTS.CHARS_PER_LINE.MIN}
							max={EDITOR_CONSTANTS.CHARS_PER_LINE.MAX}
							step={EDITOR_CONSTANTS.CHARS_PER_LINE.STEP}
							aria-label="一行あたりの文字数"
							aria-describedby="word-wrap-help"
							role="spinbutton"
						/>
						<button
							className={`${buttonStyles.stepperButton} ${buttonStyles.increment}`}
							onClick={handleWordWrapIncrement}
							aria-label="文字数を増やす"
							type="button"
						>
							＋
						</button>
					</div>
				</div>
				<Counter text={text} />
			</div>
		)
	}
)
