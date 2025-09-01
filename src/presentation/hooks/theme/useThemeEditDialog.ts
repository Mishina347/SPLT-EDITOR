import { useThemeEditor } from './useThemeEditor'
import { useColorValidation } from './useColorValidation'
import { useThemePresets } from './useThemePresets'

interface ThemeColors {
	backgroundColor: string
	textColor: string
}

interface UseThemeEditDialogProps {
	isOpen: boolean
	themeColors: ThemeColors
	onThemeUpdate: (backgroundColor: string, textColor: string) => void
	onClose: () => void
}

export const useThemeEditDialog = (props: UseThemeEditDialogProps) => {
	// テーマ編集の基本ロジック
	const {
		tempBackgroundColor,
		tempTextColor,
		handleBackgroundColorChange: baseHandleBackgroundColorChange,
		handleTextColorChange: baseHandleTextColorChange,
		handleReset,
		handleCancel,
		handleSave,
	} = useThemeEditor(props)

	// カラーバリデーション
	const {
		isValidHexColor,
		handleBackgroundColorChange: validatedBackgroundColorChange,
		handleTextColorChange: validatedTextColorChange,
		handleBackgroundColorBlur,
		handleTextColorBlur,
	} = useColorValidation({
		tempBackgroundColor,
		tempTextColor,
		onBackgroundColorChange: baseHandleBackgroundColorChange,
		onTextColorChange: baseHandleTextColorChange,
	})

	// プリセット管理
	const { colorPresets, handlePresetClick } = useThemePresets({
		onBackgroundColorChange: baseHandleBackgroundColorChange,
		onTextColorChange: baseHandleTextColorChange,
	})

	return {
		// 状態
		tempBackgroundColor,
		tempTextColor,

		// 基本ハンドラー
		handleReset,
		handleCancel,
		handleSave,

		// カラー変更ハンドラー（バリデーション付き）
		handleBackgroundColorChange: validatedBackgroundColorChange,
		handleTextColorChange: validatedTextColorChange,

		// ブラーハンドラー
		handleBackgroundColorBlur,
		handleTextColorBlur,

		// プリセット
		colorPresets,
		handlePresetClick,

		// バリデーション
		isValidHexColor,
	}
}
