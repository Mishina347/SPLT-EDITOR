import { useCallback, useMemo } from 'react'

interface ColorPreset {
	bg: string
	text: string
	name: string
}

interface UseThemePresetsProps {
	onBackgroundColorChange: (color: string) => void
	onTextColorChange: (color: string) => void
}

export const useThemePresets = ({
	onBackgroundColorChange,
	onTextColorChange,
}: UseThemePresetsProps) => {
	// プリセットカラーの定義
	const colorPresets: ColorPreset[] = useMemo(
		() => [
			{ bg: '#ffffff', text: '#000000', name: '初期テーマ' },
			{ bg: '#3F3F3F', text: '#ffffff', name: 'ダークモード' },
			{ bg: '#f8f9fa', text: '#212529', name: 'ライトグレー' },
		],
		[]
	)

	// プリセットクリック時の処理
	const handlePresetClick = useCallback(
		(preset: ColorPreset) => {
			onBackgroundColorChange(preset.bg)
			onTextColorChange(preset.text)
		},
		[onBackgroundColorChange, onTextColorChange]
	)

	return {
		colorPresets,
		handlePresetClick,
	}
}
