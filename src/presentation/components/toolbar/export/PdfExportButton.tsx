import React, { useState, useCallback } from 'react'
import { PdfExporter } from '@/infra/pdf/PdfExporter'
import { PdfExportSettings, DEFAULT_PDF_SETTINGS, EMBEDDED_FONTS, Manuscript } from '@/domain'
import buttonStyles from '../../../shared/Button/Button.module.css'
import styles from './PdfExportButton.module.css'
import { Dialog } from '../..'

interface PdfExportButtonProps {
	manuscript: Manuscript
}

export const PdfExportButton: React.FC<PdfExportButtonProps> = ({ manuscript }) => {
	const [showSettings, setShowSettings] = useState(false)
	const [exportSettings, setExportSettings] = useState<PdfExportSettings>(DEFAULT_PDF_SETTINGS)

	const handleExport = useCallback(async () => {
		try {
			const exporter = new PdfExporter(exportSettings)
			await exporter.export(manuscript)
		} catch (error) {
			console.error('PDF export failed:', error)
			alert('PDF出力に失敗しました。')
		}
	}, [exportSettings, manuscript])

	const handleSettingChange = (key: keyof PdfExportSettings, value: any) => {
		const newSettings = {
			...exportSettings,
			[key]: value,
		}
		setExportSettings(newSettings)
	}

	const handleMarginChange = (key: keyof PdfExportSettings['margins'], value: number) => {
		setExportSettings(prev => ({
			...prev,
			margins: {
				...prev.margins,
				[key]: value,
			},
		}))
	}

	const handleOutlineChange = (key: keyof PdfExportSettings['outline'], value: any) => {
		setExportSettings(prev => ({
			...prev,
			outline: {
				...prev.outline,
				[key]: value,
			},
		}))
	}

	const handleLayoutChange = (key: keyof PdfExportSettings['layout'], value: any) => {
		setExportSettings(prev => ({
			...prev,
			layout: {
				...prev.layout,
				[key]: value,
			},
		}))
	}

	return (
		<div className={styles.container}>
			<button
				className={`${buttonStyles.button} ${buttonStyles.buttonSecondary}`}
				onClick={() => setShowSettings(!showSettings)}
				title="PDF出力設定"
			>
				📄 PDF形式で出力
			</button>

			{showSettings && (
				<Dialog isOpen={showSettings} onClose={() => setShowSettings(false)} title="PDF出力設定">
					<div className={styles.settingsContent}>
						{/* 基本設定 */}
						<div className={styles.settingGroup}>
							<label className={styles.sectionLabel}>基本設定</label>
							<div className={styles.basicSettings}>
								<div>
									<label>ページサイズ:</label>
									<select
										value={exportSettings.pageSize}
										onChange={e => handleSettingChange('pageSize', e.target.value)}
									>
										<option value="A4">A4</option>
										<option value="A5">A5</option>
										<option value="B5">B5</option>
										<option value="B6">B6</option>
									</select>
								</div>
								<div>
									<label>向き:</label>
									<select
										value={exportSettings.orientation}
										onChange={e => handleSettingChange('orientation', e.target.value)}
									>
										<option value="portrait">縦向き</option>
										<option value="landscape">横向き</option>
									</select>
								</div>
							</div>
						</div>

						{/* 縦書き設定 */}
						<div className={styles.settingGroup}>
							<label className={styles.sectionLabel}>縦書き設定</label>
							<label className={styles.checkboxLabel}>
								<input
									type="checkbox"
									checked={exportSettings.verticalWriting}
									onChange={e => handleSettingChange('verticalWriting', e.target.checked)}
								/>
								縦書きで出力する
							</label>
						</div>

						{/* フォント設定 */}
						<div className={styles.settingGroup}>
							<label className={styles.sectionLabel}>フォント設定</label>
							<div className={styles.fontSettings}>
								<div>
									<label>フォント:</label>
									<select
										value={exportSettings.font.family}
										onChange={e =>
											handleSettingChange('font', {
												...exportSettings.font,
												family: e.target.value,
											})
										}
									>
										{EMBEDDED_FONTS.map((font: string) => (
											<option key={font} value={font}>
												{font}
											</option>
										))}
									</select>
								</div>
								<div>
									<label>サイズ:</label>
									<input
										type="number"
										value={exportSettings.font.size}
										onChange={e =>
											handleSettingChange('font', {
												...exportSettings.font,
												size: Number(e.target.value),
											})
										}
										min="8"
										max="24"
									/>
								</div>
								<div>
									<label>行間:</label>
									<input
										type="number"
										value={exportSettings.lineSpacing}
										onChange={e => handleSettingChange('lineSpacing', Number(e.target.value))}
										min="1.0"
										max="2.0"
										step="0.1"
									/>
								</div>
							</div>
						</div>

						{/* 余白設定 */}
						<div className={styles.settingGroup}>
							<label className={styles.sectionLabel}>余白設定（mm）</label>
							<div className={styles.marginInputs}>
								<div>
									<label>上:</label>
									<input
										type="number"
										value={exportSettings.margins.top}
										onChange={e => handleMarginChange('top', Number(e.target.value))}
										min="10"
										max="50"
									/>
								</div>
								<div>
									<label>右:</label>
									<input
										type="number"
										value={exportSettings.margins.right}
										onChange={e => handleMarginChange('right', Number(e.target.value))}
										min="10"
										max="50"
									/>
								</div>
								<div>
									<label>下:</label>
									<input
										type="number"
										value={exportSettings.margins.bottom}
										onChange={e => handleMarginChange('bottom', Number(e.target.value))}
										min="10"
										max="50"
									/>
								</div>
								<div>
									<label>左:</label>
									<input
										type="number"
										value={exportSettings.margins.left}
										onChange={e => handleMarginChange('left', Number(e.target.value))}
										min="10"
										max="50"
									/>
								</div>
							</div>
						</div>

						{/* アウトライン設定 */}
						<div className={styles.settingGroup}>
							<label className={styles.sectionLabel}>アウトライン設定</label>
							<div className={styles.outlineSettings}>
								<label className={styles.checkboxLabel}>
									<input
										type="checkbox"
										checked={exportSettings.outline.enabled}
										onChange={e => handleOutlineChange('enabled', e.target.checked)}
									/>
									アウトラインを表示する
								</label>
								<label className={styles.checkboxLabel}>
									<input
										type="checkbox"
										checked={exportSettings.outline.showPageNumbers}
										onChange={e => handleOutlineChange('showPageNumbers', e.target.checked)}
									/>
									ページ番号を表示する
								</label>
								<label className={styles.checkboxLabel}>
									<input
										type="checkbox"
										checked={exportSettings.outline.showLineNumbers}
										onChange={e => handleOutlineChange('showLineNumbers', e.target.checked)}
									/>
									行番号を表示する
								</label>
								<div>
									<label>インデントレベル:</label>
									<input
										type="number"
										value={exportSettings.outline.indentLevels}
										onChange={e => handleOutlineChange('indentLevels', Number(e.target.value))}
										min="1"
										max="5"
									/>
								</div>
							</div>
						</div>

						{/* レイアウト設定 */}
						<div className={styles.settingGroup}>
							<label className={styles.sectionLabel}>レイアウト設定</label>
							<div className={styles.layoutSettings}>
								<div>
									<label>段数:</label>
									<input
										type="number"
										value={exportSettings.layout.columns}
										onChange={e => handleLayoutChange('columns', Number(e.target.value))}
										min="1"
										max="3"
									/>
								</div>
								<div>
									<label>段間隔（mm）:</label>
									<input
										type="number"
										value={exportSettings.layout.columnGap}
										onChange={e => handleLayoutChange('columnGap', Number(e.target.value))}
										min="5"
										max="20"
									/>
								</div>
							</div>
						</div>

						{/* エクスポートボタン */}
						<div className={styles.buttonGroup}>
							<button className={buttonStyles.button} onClick={handleExport}>
								PDF出力
							</button>
						</div>
					</div>
				</Dialog>
			)}
		</div>
	)
}
