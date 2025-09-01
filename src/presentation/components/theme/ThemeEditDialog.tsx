import React from 'react'
import { Dialog } from '../../shared'
import { useThemeEditDialog } from '../../hooks'
import styles from './ThemeEditDialog.module.css'
import buttonStyles from '../../shared/Button/Button.module.css'

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
	// すべてのロジックを統合したhook
	const {
		tempBackgroundColor,
		tempTextColor,
		handleReset,
		handleCancel,
		handleSave,
		handleBackgroundColorChange,
		handleTextColorChange,
		handleBackgroundColorBlur,
		handleTextColorBlur,
		colorPresets,
		handlePresetClick,
	} = useThemeEditDialog({
		isOpen,
		themeColors,
		onThemeUpdate,
		onClose,
	})

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
								onBlur={e => handleBackgroundColorBlur(e.target.value)}
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
								onBlur={e => handleBackgroundColorBlur(e.target.value)}
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
								onBlur={e => handleTextColorBlur(e.target.value)}
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
								onBlur={e => handleTextColorBlur(e.target.value)}
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
