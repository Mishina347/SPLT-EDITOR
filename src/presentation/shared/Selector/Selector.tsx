import React from 'react'
import styles from './Selector.module.css'

interface SelectOption {
	value: string
	label: string
}

interface SelectorProps {
	label: string
	value: string
	options: SelectOption[]
	onChange: (value: string) => void
	onFocus?: () => void
	id?: string
	ariaLabel?: string
	ariaDescribedBy?: string
	disabled?: boolean
	className?: string
}

export const Selector: React.FC<SelectorProps> = ({
	label,
	value,
	options,
	onChange,
	onFocus,
	id,
	ariaLabel,
	ariaDescribedBy,
	disabled = false,
	className,
}) => {
	const handleChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
		onChange(e.target.value)
	}

	const selectId = id || `selector-${Math.random().toString(36).substr(2, 9)}`

	return (
		<div className={`${styles.container} ${className || ''}`}>
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
					{options.map(option => (
						<option key={option.value} value={option.value}>
							{option.label}
						</option>
					))}
				</select>
				<div className={styles.arrow} aria-hidden="true">
					▼
				</div>
			</div>
		</div>
	)
}
