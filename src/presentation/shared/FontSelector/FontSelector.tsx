import React from 'react'
import { FontFamily, FONT_FAMILIES, FONT_LABELS } from '../../../domain'
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
	const handleChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
		const fontFamily = e.target.value as FontFamily
		onChange(fontFamily)
	}

	const selectId = id || `font-selector-${Math.random().toString(36).substr(2, 9)}`

	return (
		<div className={styles.container}>
			<label className={styles.label} htmlFor={selectId}>
				{label}
			</label>
			<div className={styles.selectWrapper}>
				<select
					id={selectId}
					value={value}
					onChange={handleChange}
					onFocus={onFocus}
					className={styles.select}
					aria-label={ariaLabel || `${label}を選択する`}
					aria-describedby={ariaDescribedBy}
					disabled={disabled}
				>
					<option value={FONT_FAMILIES.UD_DIGITAL}>{FONT_LABELS.UD_DIGITAL}</option>
					<option value={FONT_FAMILIES.NOTO_SERIF}>{FONT_LABELS.NOTO_SERIF}</option>
				</select>
				<div className={styles.arrow} aria-hidden="true">
					▼
				</div>
			</div>
		</div>
	)
}
