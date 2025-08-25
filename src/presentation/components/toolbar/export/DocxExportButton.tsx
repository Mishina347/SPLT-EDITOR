import React, { useState, useCallback } from 'react'
import { DocxExporter } from '@/infra/docx/DocxExporter'
import { DocxExportSettings, DEFAULT_DOCX_SETTINGS, Manuscript } from '@/domain'
import buttonStyles from '../../../shared/Button/Button.module.css'
import styles from './DocxExportButton.module.css'
import { Dialog } from '../..'

interface DocxExportButtonProps {
	manuscript: Manuscript
}

export const DocxExportButton: React.FC<DocxExportButtonProps> = ({ manuscript }) => {
	const [showSettings, setShowSettings] = useState(false)
	const [exportSettings, setExportSettings] = useState<DocxExportSettings>(DEFAULT_DOCX_SETTINGS)

	const handleExport = useCallback(async () => {
		try {
			const exporter = new DocxExporter(exportSettings)
			await exporter.export(manuscript)
		} catch (error) {
			console.error('Word export failed:', error)
			alert('Word出力に失敗しました。')
		}
	}, [exportSettings, manuscript])

	const handleSettingChange = (key: keyof DocxExportSettings, value: any) => {
		const newSettings = {
			...exportSettings,
			[key]: value,
		}

		// デバッグ用：設定変更をログ出力
		if (process.env.NODE_ENV === 'development') {
			console.log(`[DocxExportButton] Setting changed: ${key} =`, value)
			console.log('[DocxExportButton] New settings:', newSettings)
		}

		setExportSettings(newSettings)
	}

	const handleMarginChange = (key: keyof DocxExportSettings['margins'], value: number) => {
		setExportSettings(prev => ({
			...prev,
			margins: {
				...prev.margins,
				[key]: value,
			},
		}))
	}

	const handlePageLayoutChange = (
		key: keyof NonNullable<DocxExportSettings['pageLayout']>,
		value: any
	) => {
		setExportSettings(prev => ({
			...prev,
			pageLayout: {
				...prev.pageLayout,
				[key]: value,
			},
		}))
	}

	const handleMirrorMarginsChange = (value: boolean) => {
		setExportSettings(prev => ({
			...prev,
			margins: {
				...prev.margins,
				mirror: value,
			},
		}))
	}

	return (
		<div className={styles.container}>
			<button
				className={`${buttonStyles.button} ${buttonStyles.buttonSecondary}`}
				onClick={() => setShowSettings(!showSettings)}
				title="Word出力設定"
			>
				📄 Word形式で出力
			</button>

			{showSettings && (
				<Dialog isOpen={showSettings} onClose={() => setShowSettings(false)} title="Word出力設定">
					<div className={styles.settingsContent}>
						<div className={styles.settingGroup}>
							<label>
								<input
									type="checkbox"
									checked={exportSettings.verticalWriting}
									onChange={e => handleSettingChange('verticalWriting', e.target.checked)}
								/>
								縦書き
							</label>
							{exportSettings.verticalWriting && (
								<div className={styles.verticalWritingInfo}>
									<span className={styles.infoText}>✅ 縦書きが有効です。A4横向きで出力されます。</span>
									<div className={styles.verticalWritingDetails}>
										<p>• テキスト方向: 上から下、右から左</p>
										<p>• ページ向き: 横向き（Landscape）</p>
										<p>• 段落配置: 右揃え</p>
										<p>• フォント: {exportSettings.font.family}</p>
									</div>
								</div>
							)}
						</div>

						<div className={styles.settingGroup}>
							<label className={styles.sectionLabel}>ページ設定</label>
							<div className={styles.pageSettings}>
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

						<div className={styles.settingGroup}>
							<label className={styles.sectionLabel}>余白設定 (mm)</label>
							<div className={styles.marginInputs}>
								<div>
									<label>上:</label>
									<input
										type="number"
										value={exportSettings.margins.top}
										onChange={e => handleMarginChange('top', Number(e.target.value))}
										min="0"
										max="100"
									/>
								</div>
								<div>
									<label>右:</label>
									<input
										type="number"
										value={exportSettings.margins.right}
										onChange={e => handleMarginChange('right', Number(e.target.value))}
										min="0"
										max="100"
									/>
								</div>
								<div>
									<label>下:</label>
									<input
										type="number"
										value={exportSettings.margins.bottom}
										onChange={e => handleMarginChange('bottom', Number(e.target.value))}
										min="0"
										max="100"
									/>
								</div>
								<div>
									<label>左:</label>
									<input
										type="number"
										value={exportSettings.margins.left}
										onChange={e => handleMarginChange('left', Number(e.target.value))}
										min="0"
										max="100"
									/>
								</div>
							</div>

							<div className={styles.advancedMargins}>
								<div>
									<label>ヘッダー:</label>
									<input
										type="number"
										value={exportSettings.margins.header || 0}
										onChange={e => handleMarginChange('header', Number(e.target.value))}
										min="0"
										max="50"
									/>
								</div>
								<div>
									<label>フッター:</label>
									<input
										type="number"
										value={exportSettings.margins.footer || 0}
										onChange={e => handleMarginChange('footer', Number(e.target.value))}
										min="0"
										max="50"
									/>
								</div>
								<div>
									<label>装丁:</label>
									<input
										type="number"
										value={exportSettings.margins.gutter || 0}
										onChange={e => handleMarginChange('gutter', Number(e.target.value))}
										min="0"
										max="50"
									/>
								</div>
							</div>

							<label>
								<input
									type="checkbox"
									checked={exportSettings.margins.mirror || false}
									onChange={e => handleMirrorMarginsChange(e.target.checked)}
								/>
								左右対称余白
							</label>
						</div>

						<div className={styles.settingGroup}>
							<label className={styles.sectionLabel}>段組み設定</label>
							<div className={styles.columnSettings}>
								<div>
									<label>段数:</label>
									<select
										value={exportSettings.pageLayout?.columns || 1}
										onChange={e => handlePageLayoutChange('columns', Number(e.target.value))}
									>
										<option value={1}>1段</option>
										<option value={2}>2段</option>
										<option value={3}>3段</option>
									</select>
								</div>
								<div>
									<label>段間隔 (mm):</label>
									<input
										type="number"
										value={exportSettings.pageLayout?.columnGap || 10}
										onChange={e => handlePageLayoutChange('columnGap', Number(e.target.value))}
										min="5"
										max="30"
									/>
								</div>
							</div>
						</div>

						<div className={styles.settingGroup}>
							<label className={styles.sectionLabel}>ページ番号設定</label>
							<div className={styles.pageNumberSettings}>
								<div>
									<label>位置:</label>
									<select
										value={exportSettings.pageLayout?.pageNumberPosition || 'bottom'}
										onChange={e => handlePageLayoutChange('pageNumberPosition', e.target.value)}
									>
										<option value="top">上部</option>
										<option value="bottom">下部</option>
										<option value="none">なし</option>
									</select>
								</div>
								<div>
									<label>
										<input
											type="checkbox"
											checked={exportSettings.pageLayout?.showHeader || false}
											onChange={e => handlePageLayoutChange('showHeader', e.target.checked)}
										/>
										ヘッダーを表示
									</label>
								</div>
								<div>
									<label>
										<input
											type="checkbox"
											checked={exportSettings.pageLayout?.showFooter || false}
											onChange={e => handlePageLayoutChange('showFooter', e.target.checked)}
										/>
										フッターを表示
									</label>
								</div>
							</div>
						</div>

						{/* デバッグ用：現在の設定値を表示 */}
						{process.env.NODE_ENV === 'development' && (
							<div className={styles.debugInfo}>
								<h4>現在の設定値（デバッグ用）:</h4>
								<pre>{JSON.stringify(exportSettings, null, 2)}</pre>
							</div>
						)}
					</div>

					<div className={styles.settingsFooter}>
						<button className={styles.exportButton} onClick={handleExport} title="Word出力実行">
							エクスポート
						</button>
					</div>
				</Dialog>
			)}
		</div>
	)
}
