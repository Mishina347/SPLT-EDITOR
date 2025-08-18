import React, { useCallback } from 'react'
import styles from './NumberStepper.module.css'
import buttonStyles from '../Button/Button.module.css'

export interface NumberStepperProps {
	label: string
	value: number
	onChange: (value: number) => void
	onFocus?: () => void
	min?: number
	max?: number
	step?: number
	disabled?: boolean
	ariaDescribedBy?: string
	className?: string
	placeholder?: string
	decrementLabel?: string
	incrementLabel?: string
}

export const NumberStepper: React.FC<NumberStepperProps> = ({
	label,
	value,
	onChange,
	onFocus,
	min,
	max,
	step = 1,
	disabled = false,
	ariaDescribedBy,
	className = '',
	placeholder,
	decrementLabel = '値を小さくする',
	incrementLabel = '値を大きくする',
}) => {
	// 値の変更処理
	const handleInputChange = useCallback(
		(e: React.ChangeEvent<HTMLInputElement>) => {
			const newValue = parseInt(e.target.value, 10)
			if (!isNaN(newValue)) {
				// min/maxの範囲内に制限
				const clampedValue = Math.max(min || -Infinity, Math.min(max || Infinity, newValue))
				onChange(clampedValue)
			}
		},
		[onChange, min, max]
	)

	// キーボード操作処理
	const handleKeyDown = useCallback(
		(e: React.KeyboardEvent<HTMLInputElement>) => {
			if (disabled) return

			switch (e.key) {
				case 'ArrowUp':
					e.preventDefault()
					handleIncrement()
					break
				case 'ArrowDown':
					e.preventDefault()
					handleDecrement()
					break
				case 'Enter':
					e.preventDefault()
					// Enterキーでフォーカスを外す
					;(e.target as HTMLInputElement).blur()
					break
				default:
					break
			}
		},
		[disabled]
	)

	// 増加処理
	const handleIncrement = useCallback(() => {
		if (disabled) return
		const newValue = value + step
		if (max === undefined || newValue <= max) {
			onChange(newValue)
		}
	}, [value, step, max, onChange, disabled])

	// 減少処理
	const handleDecrement = useCallback(() => {
		if (disabled) return
		const newValue = value - step
		if (min === undefined || newValue >= min) {
			onChange(newValue)
		}
	}, [value, step, min, onChange, disabled])

	return (
		<div className={`${styles.fieldGroup} ${className}`}>
			<label className={styles.label}>{label}</label>
			<div className={styles.inputGroup}>
				<button
					className={`${buttonStyles.stepperButton} ${buttonStyles.decrement} `}
					onClick={handleDecrement}
					aria-label={decrementLabel}
					type="button"
					disabled={disabled || (min !== undefined && value <= min)}
				>
					−
				</button>
				<input
					type="number"
					value={value}
					onChange={handleInputChange}
					onKeyDown={handleKeyDown}
					className={styles.input}
					onFocus={onFocus}
					min={min}
					max={max}
					step={step}
					aria-label={label}
					aria-describedby={ariaDescribedBy}
					role="spinbutton"
					disabled={disabled}
					placeholder={placeholder}
				/>
				<button
					className={`${buttonStyles.stepperButton} ${buttonStyles.increment}`}
					onClick={handleIncrement}
					aria-label={incrementLabel}
					type="button"
					disabled={disabled || (max !== undefined && value >= max)}
				>
					＋
				</button>
			</div>
		</div>
	)
}
