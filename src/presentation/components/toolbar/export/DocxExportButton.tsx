import React, { useState, useCallback } from 'react'
import { DocxExporter } from '@/infra/docx/DocxExporter'
import { DocxExportSettings, DEFAULT_DOCX_SETTINGS, Manuscript } from '@/domain'
import { saveAs } from 'file-saver'
import { isTauri } from '@/utils'
import buttonStyles from '../../../shared/Button/Button.module.css'
import styles from './DocxExportButton.module.css'
import { Dialog } from '../..'

interface DocxExportButtonProps {
	manuscript: Manuscript
	onExport?: () => void
}

export const DocxExportButton: React.FC<DocxExportButtonProps> = ({ manuscript, onExport }) => {
	const [showSettings, setShowSettings] = useState(false)
	const [exportSettings, setExportSettings] = useState<DocxExportSettings>(DEFAULT_DOCX_SETTINGS)
	const [fileType, setFileType] = useState<'docx' | 'dotx'>('docx')

	// 初期設定値のログも削除
	// useEffect(() => {
	// 	console.log('[DocxExportButton] Initial settings:', exportSettings)
	// 	console.log('[DocxExportButton] Initial page layout:', exportSettings.pageLayout)
	// }, [exportSettings])

	const handleExport = useCallback(async () => {
		try {
			console.log('[DEBUG] Exporting with settings:', exportSettings)
			console.log('[DEBUG] Vertical writing:', exportSettings.verticalWriting)
			console.log('[DEBUG] Page layout:', exportSettings.pageLayout)
			console.log('[DEBUG] Margins:', exportSettings.margins)
			console.log('[DEBUG] File type:', fileType)

			const exporter = new DocxExporter(exportSettings)
			await exporter.export(manuscript, fileType)
			
			// エクスポート成功時に設定ダイアログを閉じ、親のダイアログも閉じる
			setShowSettings(false)
			onExport?.()
		} catch (error) {
			console.error('Word export failed:', error)
			alert('Word出力に失敗しました。')
		}
	}, [exportSettings, manuscript, fileType, onExport])

	const handleSettingChange = (key: keyof DocxExportSettings, value: any) => {
		const newSettings = {
			...exportSettings,
			[key]: value,
		}

		console.log(`[DEBUG] Setting changed: ${key} =`, value)
		console.log('[DEBUG] New settings:', newSettings)
		setExportSettings(newSettings)
	}

	const handleMarginChange = (key: keyof DocxExportSettings['margins'], value: number) => {
		const newSettings = {
			...exportSettings,
			margins: {
				...exportSettings.margins,
				[key]: value,
			},
		}

		console.log(`[DEBUG] Margin changed: ${key} =`, value)
		console.log('[DEBUG] New margin settings:', newSettings.margins)
		setExportSettings(newSettings)
	}

	const handlePageLayoutChange = (
		key: keyof NonNullable<DocxExportSettings['pageLayout']>,
		value: any
	) => {
		const newSettings = {
			...exportSettings,
			pageLayout: {
				...exportSettings.pageLayout,
				[key]: value,
			},
		}

		console.log(`[DEBUG] Page layout changed: ${key} =`, value)
		console.log('[DEBUG] New page layout settings:', newSettings.pageLayout)
		setExportSettings(newSettings)
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

	const handleSaveAsTemplate = async () => {
		const templateData = {
			settings: exportSettings,
			timestamp: new Date().toISOString(),
			description: `${manuscript.title}用のテンプレート設定`,
		}

		const jsonContent = JSON.stringify(templateData, null, 2)
		const fileName = `${manuscript.title}_template_settings.json`

		if (isTauri()) {
			// Tauri環境ではTauriコマンドを使用してファイルを保存
			try {
				const { invoke } = await import('@tauri-apps/api/core')
				await invoke<string>('saveTextFile', {
					content: jsonContent,
				})
			} catch (error) {
				console.error('Template save failed in Tauri:', error)
				alert('テンプレート設定の保存に失敗しました。')
			}
		} else {
			// ブラウザ環境ではfile-saverを使用
			const blob = new Blob([jsonContent], {
				type: 'application/json',
			})
			saveAs(blob, fileName)
		}
	}

	const handleLoadTemplate = (event: React.ChangeEvent<HTMLInputElement>) => {
		const file = event.target.files?.[0]
		if (!file) return

		const reader = new FileReader()
		reader.onload = e => {
			try {
				const templateData = JSON.parse(e.target?.result as string)
				if (templateData.settings) {
					setExportSettings(templateData.settings)
					alert('テンプレート設定を読み込みました')
				}
			} catch (error) {
				console.error('Template loading failed:', error)
				alert('テンプレート設定の読み込みに失敗しました')
			}
		}
		reader.readAsText(file)
	}

	return (
		<div className={styles.container}>
			<button
				className={`${buttonStyles.button} ${buttonStyles.buttonSecondary}`}
				onClick={() => setShowSettings(!showSettings)}
				title={fileType === 'dotx' ? 'Wordテンプレート出力設定' : 'Word出力設定'}
			>
				{fileType === 'dotx' ? '📋 Wordテンプレート' : '📄 Word形式で出力'}
			</button>

			{showSettings && (
				<Dialog isOpen={showSettings} onClose={() => setShowSettings(false)} title="Word出力設定">
					<div className={styles.settingsContent}>
						<div className={styles.settingGroup}>
							<label className={styles.sectionLabel}>出力形式</label>
							<div className={styles.fileTypeSelection}>
								<label className={styles.radioLabel}>
									<input
										type="radio"
										name="fileType"
										value="docx"
										checked={fileType === 'docx'}
										onChange={e => setFileType(e.target.value as 'docx' | 'dotx')}
									/>
									.docx (Word文書)
								</label>
								<label className={styles.radioLabel}>
									<input
										type="radio"
										name="fileType"
										value="dotx"
										checked={fileType === 'dotx'}
										onChange={e => setFileType(e.target.value as 'docx' | 'dotx')}
									/>
									.dotx (Wordテンプレート)
								</label>
							</div>
							{fileType === 'dotx' && (
								<div className={styles.templateInfo}>
									<span className={styles.infoText}>
										📝 テンプレートとして出力されます。設定が保存され、他の文書で再利用できます。
									</span>
									<div className={styles.templateActions}>
										<button
											type="button"
											className={styles.templateButton}
											onClick={handleSaveAsTemplate}
											title="現在の設定をテンプレートとして保存"
										>
											💾 設定を保存
										</button>
										<label className={styles.templateButton}>
											📂 設定を読み込み
											<input
												type="file"
												accept=".json"
												onChange={handleLoadTemplate}
												style={{ display: 'none' }}
											/>
										</label>
									</div>
								</div>
							)}
							{/* デバッグ用：現在の設定値を表示 */}
							{process.env.NODE_ENV === 'development' && (
								<div className={styles.debugInfo}>
									<h4>現在の設定値（デバッグ用）:</h4>
									<div className={styles.debugSection}>
										<h5>基本設定:</h5>
										<p>縦書き: {exportSettings.verticalWriting ? '有効' : '無効'}</p>
										<p>ページサイズ: {exportSettings.pageSize}</p>
										<p>向き: {exportSettings.orientation}</p>
									</div>
									<div className={styles.debugSection}>
										<h5>余白設定:</h5>
										<p>
											上: {exportSettings.margins.top}mm, 右: {exportSettings.margins.right}mm
										</p>
										<p>
											下: {exportSettings.margins.bottom}mm, 左: {exportSettings.margins.left}mm
										</p>
										<p>
											ヘッダー: {exportSettings.margins.header || 0}mm, フッター:{' '}
											{exportSettings.margins.footer || 0}mm
										</p>
									</div>
									<div className={styles.debugSection}>
										<h5>ページレイアウト:</h5>
										<p>段数: {exportSettings.pageLayout?.columns || 1}</p>
										<p>段間隔: {exportSettings.pageLayout?.columnGap || 10}mm</p>
										<p>ページ番号位置: {exportSettings.pageLayout?.pageNumberPosition || 'bottom'}</p>
										<p>ヘッダー表示: {exportSettings.pageLayout?.showHeader ? '有効' : '無効'}</p>
										<p>フッター表示: {exportSettings.pageLayout?.showFooter ? '有効' : '無効'}</p>
									</div>
									<pre>{JSON.stringify(exportSettings, null, 2)}</pre>
								</div>
							)}
						</div>

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
							<label className={styles.sectionLabel}>アウトライン設定（余白）</label>
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
									<span className={styles.unit}>mm</span>
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
									<span className={styles.unit}>mm</span>
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
									<span className={styles.unit}>mm</span>
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
									<span className={styles.unit}>mm</span>
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
									<span className={styles.unit}>mm</span>
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
									<span className={styles.unit}>mm</span>
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
									<span className={styles.unit}>mm</span>
								</div>
							</div>

							<label className={styles.checkboxLabel}>
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
									<label>段間隔:</label>
									<input
										type="number"
										value={exportSettings.pageLayout?.columnGap || 10}
										onChange={e => handlePageLayoutChange('columnGap', Number(e.target.value))}
										min="5"
										max="30"
									/>
									<span className={styles.unit}>mm</span>
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
									<label className={styles.checkboxLabel}>
										<input
											type="checkbox"
											checked={exportSettings.pageLayout?.showHeader || false}
											onChange={e => handlePageLayoutChange('showHeader', e.target.checked)}
										/>
										ヘッダーを表示
									</label>
								</div>
								<div>
									<label className={styles.checkboxLabel}>
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

						<div className={styles.settingsFooter}>
							<button
								onClick={() => setShowSettings(false)}
								className={`${buttonStyles.button} ${buttonStyles.buttonSecondary}`}
							>
								キャンセル
							</button>
							<button
								className={`${buttonStyles.button} ${buttonStyles.buttonSecondary}`}
								onClick={handleExport}
								title="Word出力実行"
							>
								エクスポート
							</button>
						</div>
					</div>
				</Dialog>
			)}
		</div>
	)
}
