import { useCallback } from 'react'
import { logger } from '@/utils/logger'

interface UseColorValidationProps {
	tempBackgroundColor: string
	tempTextColor: string
	onBackgroundColorChange: (color: string) => void
	onTextColorChange: (color: string) => void
}

export const useColorValidation = ({
	tempBackgroundColor,
	tempTextColor,
	onBackgroundColorChange,
	onTextColorChange,
}: UseColorValidationProps) => {
	// カラーコードのバリデーション
	const isValidHexColor = useCallback((color: string): boolean => {
		return /^#([A-Fa-f0-9]{6}|[A-Fa-f0-9]{3})$/.test(color)
	}, [])

	// 背景色の変更処理（バリデーション付き）
	const handleBackgroundColorChange = useCallback(
		(newColor: string) => {
			logger.debug('ThemeEditDialog', 'Background color input change', newColor)
			onBackgroundColorChange(newColor)
		},
		[onBackgroundColorChange]
	)

	// 文字色の変更処理（バリデーション付き）
	const handleTextColorChange = useCallback(
		(newColor: string) => {
			logger.debug('ThemeEditDialog', 'Text color input change', newColor)
			onTextColorChange(newColor)
		},
		[onTextColorChange]
	)

	// 背景色のブラー処理（値の再確認）
	const handleBackgroundColorBlur = useCallback(
		(inputValue: string) => {
			logger.debug('ThemeEditDialog', 'Background color input blur', inputValue)
			// ブラー時に値を再確認
			if (inputValue !== tempBackgroundColor) {
				onBackgroundColorChange(inputValue)
			}
		},
		[tempBackgroundColor, onBackgroundColorChange]
	)

	// 文字色のブラー処理（値の再確認）
	const handleTextColorBlur = useCallback(
		(inputValue: string) => {
			logger.debug('ThemeEditDialog', 'Text color input blur', inputValue)
			// ブラー時に値を再確認
			if (inputValue !== tempTextColor) {
				onTextColorChange(inputValue)
			}
		},
		[tempTextColor, onTextColorChange]
	)

	return {
		isValidHexColor,
		handleBackgroundColorChange,
		handleTextColorChange,
		handleBackgroundColorBlur,
		handleTextColorBlur,
	}
}
