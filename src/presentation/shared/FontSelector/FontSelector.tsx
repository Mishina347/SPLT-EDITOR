import React from 'react'
import { FontFamily, FONT_FAMILIES, FONT_LABELS } from '../../../domain'
import { Selector } from '../Selector/Selector'
import styles from './FontSelector.module.css'

interface FontSelectorProps {
	label: string
	value: FontFamily
	onChange: (fontFamily: FontFamily) => void
	onFocus?: () => void
	id?: string
	ariaLabel?: string
	ariaDescribedBy?: string
	disabled?: boolean
}

export const FontSelector: React.FC<FontSelectorProps> = ({
	label,
	value,
	onChange,
	onFocus,
	id,
	ariaLabel,
	ariaDescribedBy,
	disabled = false,
}) => {
	// フォントオプションをSelectorコンポーネント用の形式に変換
	const fontOptions = [
		{ value: FONT_FAMILIES.UD_DIGITAL, label: FONT_LABELS.UD_DIGITAL },
		{ value: FONT_FAMILIES.NOTO_SERIF, label: FONT_LABELS.NOTO_SERIF },
	]

	const handleChange = (selectedValue: string) => {
		onChange(selectedValue as FontFamily)
	}

	return (
		<div className={styles.container}>
			<div className={styles.selectWrapper}>
				<Selector
					className={styles.select}
					label={label}
					value={value}
					options={fontOptions}
					onChange={handleChange}
					onFocus={onFocus}
					id={id}
					ariaLabel={ariaLabel}
					ariaDescribedBy={ariaDescribedBy}
					disabled={disabled}
				/>
			</div>
		</div>
	)
}
