import { useState, useCallback, useRef, useEffect } from 'react'

interface UseNumberStepperOptions {
	initialValue: number
	min?: number
	max?: number
	step?: number
	onChange: (value: number) => void
}

export function useNumberStepper({
	initialValue,
	min,
	max,
	step = 1,
	onChange,
}: UseNumberStepperOptions) {
	// 内部状態でテキスト入力を管理
	const [inputValue, setInputValue] = useState(initialValue.toString())
	const [isEditing, setIsEditing] = useState(false)
	const [lastValidValue, setLastValidValue] = useState(initialValue)
	const inputRef = useRef<HTMLInputElement>(null)

	// 外部のvalueが変更された場合、内部状態を同期
	useEffect(() => {
		if (!isEditing) {
			setInputValue(initialValue.toString())
			setLastValidValue(initialValue)
		}
	}, [initialValue, isEditing])

	// 入力開始時の処理
	const handleInputFocus = useCallback(() => {
		setIsEditing(true)
	}, [])

	// 入力中の処理（レンダリングは発生しない）
	const handleInputChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
		const newInputValue = e.target.value
		setInputValue(newInputValue)
		// ここではonChangeを呼ばない（確定するまで待機）
	}, [])

	// 入力確定時の処理
	const handleInputBlur = useCallback(() => {
		setIsEditing(false)

		// 入力値を数値に変換して検証
		const newValue = parseInt(inputValue, 10)
		if (!isNaN(newValue)) {
			// min/maxの範囲内に制限
			const clampedValue = Math.max(min || -Infinity, Math.min(max || Infinity, newValue))

			// 値が実際に変更された場合のみonChangeを呼び出し
			if (clampedValue !== lastValidValue) {
				setLastValidValue(clampedValue)
				onChange(clampedValue)
			}
		} else {
			// 無効な値の場合は元の値に戻す
			setInputValue(lastValidValue.toString())
		}
	}, [inputValue, lastValidValue, onChange, min, max])

	// 増加処理
	const handleIncrement = useCallback(() => {
		const newValue = lastValidValue + step
		if (max === undefined || newValue <= max) {
			const clampedValue = Math.max(min || -Infinity, Math.min(max || Infinity, newValue))
			setLastValidValue(clampedValue)
			setInputValue(clampedValue.toString())
			onChange(clampedValue)
		}
	}, [lastValidValue, step, max, min, onChange])

	// 減少処理
	const handleDecrement = useCallback(() => {
		const newValue = lastValidValue - step
		if (min === undefined || newValue >= min) {
			const clampedValue = Math.max(min || -Infinity, Math.min(max || Infinity, newValue))
			setLastValidValue(clampedValue)
			setInputValue(clampedValue.toString())
			onChange(clampedValue)
		}
	}, [lastValidValue, step, min, max, onChange])

	// 値のリセット処理
	const resetValue = useCallback(() => {
		setInputValue(lastValidValue.toString())
		setIsEditing(false)
	}, [lastValidValue])

	// 値の検証
	const validateValue = useCallback(
		(value: number): boolean => {
			if (isNaN(value)) return false
			if (min !== undefined && value < min) return false
			if (max !== undefined && value > max) return false
			return true
		},
		[min, max]
	)

	return {
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
		validateValue,
	}
}
