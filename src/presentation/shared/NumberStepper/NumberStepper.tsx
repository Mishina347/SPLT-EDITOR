import React, { useCallback } from 'react'
import styles from './NumberStepper.module.css'
import buttonStyles from '../Button/Button.module.css'
import { useNumberStepper } from './useNumberStepper'
import { usePerformanceMonitor } from '../../hooks'

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

export const NumberStepper = React.memo<NumberStepperProps>(
	({
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
		// パフォーマンス監視
		const performanceMonitor = usePerformanceMonitor('NumberStepper')

		// カスタムフックで状態管理を最適化
		const {
			inputValue,
			isEditing,
			lastValidValue,
			inputRef,
			handleInputFocus,
			handleInputChange,
			handleInputBlur,
			handleIncrement,
			handleDecrement,
			resetValue,
		} = useNumberStepper({
			initialValue: value,
			min,
			max,
			step,
			onChange,
		})

		// 入力開始時の処理（onFocusコールバックを追加）
		const handleFocus = useCallback(
			(e: React.FocusEvent<HTMLInputElement>) => {
				handleInputFocus()
				onFocus?.()
			},
			[handleInputFocus, onFocus]
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
						// Enterキーで確定
						inputRef.current?.blur()
						break
					case 'Escape':
						e.preventDefault()
						// Escapeキーでキャンセル（元の値に戻す）
						resetValue()
						inputRef.current?.blur()
						break
					default:
						break
				}
			},
			[disabled, handleIncrement, handleDecrement, resetValue]
		)

		return (
			<div className={`${styles.fieldGroup} ${className}`}>
				<label className={styles.label}>{label}</label>
				<div className={styles.inputGroup}>
					<button
						className={`${buttonStyles.stepperButton} ${buttonStyles.decrement} `}
						onClick={handleDecrement}
						aria-label={decrementLabel}
						type="button"
						disabled={disabled || (min !== undefined && lastValidValue <= min)}
					>
						−
					</button>
					<input
						ref={inputRef}
						type="number"
						value={inputValue}
						onChange={handleInputChange}
						onKeyDown={handleKeyDown}
						onFocus={handleFocus}
						onBlur={handleInputBlur}
						className={styles.input}
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
						disabled={disabled || (max !== undefined && lastValidValue >= max)}
					>
						＋
					</button>
				</div>
			</div>
		)
	}
)
