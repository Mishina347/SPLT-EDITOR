import React, { useCallback, useEffect, useState } from 'react'
import { logger } from '@/utils/logger'
import { Dialog } from '../../shared'
import styles from './ThemeEditDialog.module.css'
import buttonStyles from '../../shared/Button/Button.module.css'
import { hexToRgba, COLOR_CONSTANTS } from '../../../utils'

interface ThemeEditDialogProps {
	isOpen: boolean
	onClose: () => void
	onThemeUpdate: (backgroundColor: string, textColor: string) => void
	themeColors: {
		backgroundColor: string
		textColor: string
	}
}

export const ThemeEditDialog: React.FC<ThemeEditDialogProps> = ({
	isOpen,
	onClose,
	onThemeUpdate,
	themeColors,
}) => {
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

	const handleBackgroundColorChange = useCallback(
		(newColor: string) => {
			logger.debug('ThemeEditDialog', 'Background color changed to', newColor)
			setTempBackgroundColor(newColor)
		},
		[hexToRgba]
	)

	const handleTextColorChange = useCallback((newColor: string) => {
		logger.debug('ThemeEditDialog', 'Text color changed to', newColor)
		setTempTextColor(newColor)
		// リアルタイムでCSS変数を更新
	}, [])

	const handlePresetClick = useCallback(
		(preset: { bg: string; text: string }) => {
			setTempBackgroundColor(preset.bg)
			setTempTextColor(preset.text)
			// CSS変数も更新
		},
		[hexToRgba]
	)

	const handleReset = useCallback(() => {
		setTempBackgroundColor(themeColors?.backgroundColor || '#ffffff')
		setTempTextColor(themeColors?.textColor || '#000000')
	}, [])

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

	const colorPresets = [
		{ bg: '#ffffff', text: '#000000', name: '初期テーマ' },
		{ bg: '#3F3F3F', text: '#ffffff', name: 'ダークモード' },
		{ bg: '#f8f9fa', text: '#212529', name: 'ライトグレー' },
	]

	if (!isOpen) return null

	return (
		<Dialog
			isOpen={isOpen}
			onClose={onClose}
			title="テーマ編集"
			constrainToContainer={true}
			maxWidth="80vw"
			maxHeight="95vh"
		>
			<div className={styles.themeEditContainer}>
				{/* プレビューエリア */}
				<div className={styles.previewSection}>
					<h4>プレビュー</h4>
					<div
						className={styles.previewArea}
						style={{
							backgroundColor: tempBackgroundColor,
							color: tempTextColor,
						}}
					>
						<p>これはプレビューテキストです。</p>
						<p>背景色と文字色の組み合わせを確認できます。</p>
					</div>
				</div>

				{/* カラーピッカーエリア */}
				<div className={styles.colorPickerSection}>
					<div className={styles.colorOption}>
						<label htmlFor="backgroundColor">背景色</label>
						<fieldset className={styles.colorInputGroup}>
							<input
								id="backgroundColor"
								aria-label="背景色"
								type="color"
								value={tempBackgroundColor}
								onChange={e => handleBackgroundColorChange(e.target.value)}
								onBlur={e => {
									logger.debug('ThemeEditDialog', 'Background color input blur', e.target.value)
									// ブラー時に値を再確認
									if (e.target.value !== tempBackgroundColor) {
										handleBackgroundColorChange(e.target.value)
									}
								}}
								className={styles.colorInput}
								style={{
									touchAction: 'manipulation',
								}}
							/>
							<input
								type="text"
								aria-label="背景色"
								value={tempBackgroundColor}
								onChange={e => handleBackgroundColorChange(e.target.value)}
								onBlur={e => {
									logger.debug('ThemeEditDialog', 'Background color text input blur', e.target.value)
									// ブラー時に値を再確認
									if (e.target.value !== tempBackgroundColor) {
										handleBackgroundColorChange(e.target.value)
									}
								}}
								className={styles.colorTextInput}
								placeholder="#000000"
								style={{
									touchAction: 'manipulation',
								}}
							/>
						</fieldset>

						<label htmlFor="textColor">文字色</label>
						<fieldset className={styles.colorInputGroup}>
							<input
								aria-label="文字色"
								id="textColor"
								type="color"
								value={tempTextColor}
								onChange={e => handleTextColorChange(e.target.value)}
								onBlur={e => {
									logger.debug('ThemeEditDialog', 'Text color input blur', e.target.value)
									// ブラー時に値を再確認
									if (e.target.value !== tempTextColor) {
										handleTextColorChange(e.target.value)
									}
								}}
								className={styles.colorInput}
								style={{
									touchAction: 'manipulation',
								}}
							/>
							<input
								type="text"
								aria-label="文字色"
								value={tempTextColor}
								onChange={e => handleTextColorChange(e.target.value)}
								onBlur={e => {
									logger.debug('ThemeEditDialog', 'Text color text input blur', e.target.value)
									// ブラー時に値を再確認
									if (e.target.value !== tempTextColor) {
										handleTextColorChange(e.target.value)
									}
								}}
								className={styles.colorTextInput}
								placeholder="#ffffff"
								style={{
									touchAction: 'manipulation',
								}}
							/>
						</fieldset>
					</div>
				</div>

				{/* プリセットカラー */}
				<div className={styles.presetSection}>
					<h4>プリセットカラー</h4>
					<div className={styles.presetColors}>
						{colorPresets.map((preset, index) => (
							<button
								key={index}
								className={styles.colorPresetButton}
								onClick={() => handlePresetClick(preset)}
								style={{
									backgroundColor: preset.bg,
									color: preset.text,
								}}
								aria-label={`プリセット: ${preset.name}`}
							>
								{preset.name}
							</button>
						))}
					</div>
				</div>
			</div>
			{/* アクションボタン */}
			<div className={styles.themeActionButtons}>
				<button
					onClick={handleReset}
					className={`${buttonStyles.button} ${buttonStyles.buttonSecondary}`}
				>
					リセット
				</button>
				<div className={styles.themeMainActions}>
					<button
						onClick={handleCancel}
						className={`${buttonStyles.button} ${buttonStyles.buttonSecondary}`}
					>
						キャンセル
					</button>
					<button
						onClick={e => {
							console.log('Save button onClick triggered')
							e.preventDefault()
							handleSave()
						}}
						className={`${buttonStyles.button} ${buttonStyles.buttonPrimary}`}
						style={{
							touchAction: 'manipulation', // タッチ操作を最適化
							WebkitTapHighlightColor: 'rgba(0,0,0,0)', // タップハイライトを無効化
						}}
					>
						保存
					</button>
				</div>
			</div>
		</Dialog>
	)
}
