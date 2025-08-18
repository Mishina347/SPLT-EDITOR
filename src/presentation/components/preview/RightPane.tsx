import React, { useMemo, useState, useCallback, useEffect } from 'react'
import { html as diff2html, parse as diffParse } from 'diff2html'
import 'diff2html/bundles/css/diff2html.min.css'
import { PreviewMode, LayoutConfig, TextSnapshot } from '../../../domain'
import { Diff2HtmlAdapter } from '../../../infra'
import { useFocusTrap } from '../../hooks'

import { TabPanel, TabItem } from '../'
import { Preview, TextHistoryTimeline, HistoryDetailDialog } from './'
import styles from './RightPane.module.css'
import buttonStyles from '../../shared/Button/Button.module.css'

interface PreviewPaneProps {
	currentSavedText: string // Editorからリアルタイム取得
	lastSavedText: string // 保存時のテキスト
	previewSetting: LayoutConfig
	textHistory: TextSnapshot[]
	isMaximized: boolean
	isDraggableMode?: boolean
	onMaximize: () => void
	onFocusPane: () => void
	onRestoreHistory?: (snapshot: TextSnapshot) => void

	onPageInfoChange?: (currentPage: number, totalPages: number) => void
}

export const RightPane: React.FC<PreviewPaneProps> = ({
	currentSavedText,
	lastSavedText,
	previewSetting,
	textHistory,
	isMaximized,
	onMaximize,
	onFocusPane,
	onRestoreHistory,

	onPageInfoChange,
}) => {
	const [mode, setMode] = useState<PreviewMode>(PreviewMode.VERTICAL)
	const [selectedSnapshotId, setSelectedSnapshotId] = useState<string | undefined>()
	const [showHistoryDetailDialog, setShowHistoryDetailDialog] = useState(false)
	const [isFocusMode, setIsFocusMode] = useState(false)
	const [currentPageInfo, setCurrentPageInfo] = useState({ currentPage: 1, totalPages: 1 })

	// フォーカスモードハンドラー
	const handleFocusMode = useCallback((focused: boolean) => {
		setIsFocusMode(focused)
	}, [])

	// ページ情報更新ハンドラー
	const handleInternalPageInfoChange = useCallback(
		(currentPage: number, totalPages: number) => {
			setCurrentPageInfo({ currentPage, totalPages })
			// 外部にも通知
			onPageInfoChange?.(currentPage, totalPages)
		},
		[onPageInfoChange]
	)

	// 差分表示モードでのフォーカストラップ
	const diffFocusTrapRef = useFocusTrap(mode === PreviewMode.DIFF)

	// 差分計算を最適化（DIFFモードが選択された時のみ計算）
	const diffService = useMemo(() => new Diff2HtmlAdapter(), [])

	// 差分計算を遅延実行（DIFFモードが選択された時のみ）
	const [diffHtml, setDiffHtml] = useState('')

	// DIFFモードが選択された時のみ差分を計算
	useEffect(() => {
		if (mode === PreviewMode.DIFF) {
			const unifiedDiff = diffService.generateUnifiedDiff(
				'previous',
				'current',
				lastSavedText,
				currentSavedText
			)
			const diffJson = diffParse(unifiedDiff)
			const diffHtmlResult = diff2html(diffJson, {
				drawFileList: false,
				matching: 'lines',
				outputFormat: 'line-by-line',
			})
			setDiffHtml(diffHtmlResult)
		} else {
			// DIFFモードでない場合は空文字を設定
			setDiffHtml('')
		}
	}, [mode, diffService, lastSavedText, currentSavedText])

	const charsPerLine = useMemo(() => {
		return previewSetting.charsPerLine
	}, [previewSetting])

	const linesPerPage = useMemo(() => {
		return previewSetting.linesPerPage
	}, [previewSetting])

	// タブ設定
	const tabs: TabItem[] = useMemo(
		() => [
			{
				id: PreviewMode.VERTICAL,
				label: 'プレビュー',
				ariaLabel: 'テキストのプレビュー表示',
			},
			{
				id: PreviewMode.DIFF,
				label: '差分表示',
				ariaLabel: '変更前後の差分表示',
			},
			{
				id: PreviewMode.HISTORY,
				label: '履歴',
				ariaLabel: 'テキストの編集履歴',
			},
		],
		[]
	)

	const handleTabChange = useCallback(
		(tabId: string) => {
			setMode(tabId as PreviewMode)
			// モード切替時にフォーカスモードを解除
			if (isFocusMode) {
				setIsFocusMode(false)
			}
		},
		[isFocusMode]
	)

	// タブコンテンツのレンダリング
	const renderTabContent = useCallback(() => {
		if (mode === PreviewMode.DIFF) {
			return (
				<div className={styles.diffContainer}>
					<div
						ref={diffFocusTrapRef}
						className={styles.diffViewer}
						dangerouslySetInnerHTML={{ __html: diffHtml }}
					/>
				</div>
			)
		} else if (mode === PreviewMode.HISTORY) {
			return (
				<div className={styles.historyContainer}>
					<TextHistoryTimeline
						snapshots={textHistory}
						selectedSnapshotId={selectedSnapshotId}
						onSnapshotSelect={snapshot => {
							setSelectedSnapshotId(snapshot.id)
							setShowHistoryDetailDialog(true)
						}}
					/>
				</div>
			)
		} else {
			return (
				<Preview
					text={currentSavedText}
					isMaximized={isMaximized}
					config={{ charsPerLine, linesPerPage }}
					onFocusMode={handleFocusMode}
					onPageInfoChange={handleInternalPageInfoChange}
				/>
			)
		}
	}, [
		mode,
		diffFocusTrapRef,
		diffHtml,
		textHistory,
		selectedSnapshotId,
		currentSavedText,
		isMaximized,
		charsPerLine,
		linesPerPage,
		handleFocusMode,
		handleInternalPageInfoChange,
	])

	return (
		<div
			className={styles.rightPaneContent}
			tabIndex={0}
			onFocus={onFocusPane}
			style={{
				background: 'var(--app-bg-color, #f0f0f0)',
				color: 'var(--app-text-color, #000000)',
				transition: 'background-color 0.3s ease, color 0.3s ease',
			}}
		>
			<button
				className={`${buttonStyles.maximizeBtn} ${styles.maximizeBtnPosition}
					${isMaximized ? buttonStyles.buttonActive : buttonStyles.buttonSecondary}
				`}
				aria-pressed={isMaximized ? 'true' : 'false'}
				onClick={e => {
					e.preventDefault()
					e.stopPropagation() // 長押しリサイズとの競合を防ぐ
					onMaximize()
					if (isFocusMode) {
						setIsFocusMode(false)
					}
				}}
				onTouchEnd={e => {
					console.log('RightPane maximize button touch end')
					e.preventDefault()
					e.stopPropagation() // 長押しリサイズとの競合を防ぐ
					onMaximize()
					if (isFocusMode) {
						setIsFocusMode(false)
					}
				}}
				style={{
					touchAction: 'manipulation',
					WebkitTapHighlightColor: 'rgba(0,0,0,0)',
					zIndex: 1001, // 長押しリサイズエリアより上に配置
				}}
			>
				⛶
			</button>

			{/* タブUI（両方のモードで表示） */}
			<TabPanel
				tabs={tabs}
				activeTabId={mode}
				onTabChange={handleTabChange}
				className={styles.tabContainer}
				isTransparent={isFocusMode && mode === PreviewMode.VERTICAL}
			>
				{renderTabContent()}
			</TabPanel>

			{/* ページ番号表示（プレビューモード時のみ） */}
			{mode === PreviewMode.VERTICAL && currentPageInfo.totalPages > 1 && (
				<div className={styles.pageNumberBar}>
					<span className={styles.pageNumber}>
						{currentPageInfo.currentPage} / {currentPageInfo.totalPages} ページ
					</span>
				</div>
			)}

			{/* 履歴詳細ダイアログ */}
			<HistoryDetailDialog
				isOpen={showHistoryDetailDialog}
				onClose={() => setShowHistoryDetailDialog(false)}
				selectedSnapshotId={selectedSnapshotId}
				textHistory={textHistory}
				onRestore={onRestoreHistory}
			/>
		</div>
	)
}
