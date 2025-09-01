import { useState, useCallback, useEffect } from 'react'
import { logger } from '@/utils/logger'

interface ThemeColors {
	backgroundColor: string
	textColor: string
}

interface UseThemeEditorProps {
	isOpen: boolean
	themeColors: ThemeColors
	onThemeUpdate: (backgroundColor: string, textColor: string) => void
	onClose: () => void
}

export const useThemeEditor = ({
	isOpen,
	themeColors,
	onThemeUpdate,
	onClose,
}: UseThemeEditorProps) => {
	const [tempBackgroundColor, setTempBackgroundColor] = useState(
		themeColors?.backgroundColor || '#ffffff'
	)
	const [tempTextColor, setTempTextColor] = useState(themeColors?.textColor || '#000000')
	const [isInitialized, setIsInitialized] = useState(false)

	// ダイアログが開いたときのみ初期化
	useEffect(() => {
		if (isOpen && !isInitialized) {
			logger.debug('ThemeEditDialog', 'Dialog opened, initializing colors', themeColors)
			setTempBackgroundColor(themeColors?.backgroundColor || '#ffffff')
			setTempTextColor(themeColors?.textColor || '#000000')
			setIsInitialized(true)
		} else if (!isOpen) {
			// ダイアログが閉じられたら初期化フラグをリセット
			setIsInitialized(false)
		}
	}, [isOpen, isInitialized, themeColors?.backgroundColor, themeColors?.textColor])

	const handleBackgroundColorChange = useCallback((newColor: string) => {
		logger.debug('ThemeEditDialog', 'Background color changed to', newColor)
		setTempBackgroundColor(newColor)
	}, [])

	const handleTextColorChange = useCallback((newColor: string) => {
		logger.debug('ThemeEditDialog', 'Text color changed to', newColor)
		setTempTextColor(newColor)
	}, [])

	const handleReset = useCallback(() => {
		setTempBackgroundColor(themeColors?.backgroundColor || '#ffffff')
		setTempTextColor(themeColors?.textColor || '#000000')
	}, [themeColors?.backgroundColor, themeColors?.textColor])

	const handleCancel = useCallback(() => {
		onClose()
	}, [onClose])

	const handleSave = useCallback(() => {
		logger.info('ThemeEditDialog', 'Theme save button clicked', {
			tempBackgroundColor,
			tempTextColor,
		})
		logger.debug('ThemeEditDialog', 'Current themeColors before save', themeColors)
		onThemeUpdate(tempBackgroundColor, tempTextColor)
		onClose()
	}, [onThemeUpdate, tempBackgroundColor, tempTextColor, onClose, themeColors])

	return {
		tempBackgroundColor,
		tempTextColor,
		handleBackgroundColorChange,
		handleTextColorChange,
		handleReset,
		handleCancel,
		handleSave,
	}
}
