import React, { useCallback, useMemo } from 'react'
import { PreviewMode, LayoutConfig, TextSnapshot } from '@/domain'
import { Preview } from './preview/Preview'
import { useRightPane } from '../../hooks'
import { TabPanel } from '../'
import { TextHistoryTimeline, HistoryDetailDialog, DictionaryViewer } from './'
import styles from './RightPane.module.css'
import buttonStyles from '../../shared/Button/Button.module.css'

interface PreviewPaneProps {
	currentSavedText: string // 現在保存されているテキスト
	currentNotSavedText: string // 現在編集中のテキスト（リアルタイム）
	initialText: string
	setInitialText: (text: string) => void
	lastSavedText: string // 最後に保存されたテキスト
	previewSetting: LayoutConfig
	textHistory: TextSnapshot[]
	isMaximized: boolean
	isDraggableMode?: boolean
	onMaximize: () => void
	onFocusPane: () => void
	onRestoreHistory?: (snapshot: TextSnapshot) => void
	onPageInfoChange?: (currentPage: number, totalPages: number) => void
	// ページ情報を直接受け取る
	currentPageInfo?: { currentPage: number; totalPages: number }
	// 選択されたテキスト
	selectedText?: string
}

export const RightPane: React.FC<PreviewPaneProps> = ({
	currentSavedText,
	currentNotSavedText,
	initialText,
	setInitialText,
	previewSetting,
	textHistory,
	isMaximized,
	onMaximize,
	onFocusPane,
	onRestoreHistory,
	onPageInfoChange,
	currentPageInfo: externalPageInfo,
	selectedText,
}) => {
	// すべてのロジックを統合したhook
	const {
		// refs
		containerRef,
		diffFocusTrapRef,

		// state
		mode,
		isFocusMode,
		diffHtml,
		selectedSnapshotId,
		showHistoryDetailDialog,
		dictionaryResult,
		isDictionaryLoading,
		dictionaryError,

		// config
		tabs,
		previewConfig,

		// handlers
		handleTabChange,
		optimizedHandleFocusMode,
		handleInternalPageInfoChange,
		handleSnapshotSelect,
		handleCloseHistoryDialog,
		setIsFocusMode,
	} = useRightPane({
		currentSavedText,
		currentNotSavedText,
		initialText,
		setInitialText,
		previewSetting,
		textHistory,
		isMaximized,
		onRestoreHistory,
		onPageInfoChange,
		selectedText,
	})

	// ページ情報を外部から渡されたものと内部のものを組み合わせ
	const currentPageInfo = useMemo(() => {
		return externalPageInfo || { currentPage: 1, totalPages: 1 }
	}, [externalPageInfo])

	// タブコンテンツのレンダリング
	const renderTabContent = useCallback(() => {
		if (mode === PreviewMode.DIFF) {
			return (
				<div className={styles.diffContainer}>
					{/* 差分情報ヘッダー */}
					<div className={styles.diffHeader}>
						<div className={styles.diffInfo}>
							<h3 className={styles.diffTitle}>差分表示</h3>
						</div>
						{/* 差分基準更新ボタン */}
						<button
							className={`${buttonStyles.button} ${buttonStyles.buttonSecondary}`}
							onClick={() => setInitialText(currentNotSavedText)}
							disabled={initialText === currentNotSavedText}
							aria-label="差分基準を更新するボタン"
							aria-pressed={initialText === currentNotSavedText ? 'true' : 'false'}
							title={initialText === currentNotSavedText ? '差分基準は更新済み' : '現在の文章を基準にする'}
						>
							{initialText === currentNotSavedText ? '差分基準は更新済み' : '現在の文章を基準にする'}
						</button>
					</div>
					{/* 差分表示エリア */}
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
						onSnapshotSelect={handleSnapshotSelect}
					/>
				</div>
			)
		} else if (mode === PreviewMode.DICTIONARY) {
			return (
				<DictionaryViewer
					searchResult={dictionaryResult}
					isLoading={isDictionaryLoading}
					error={dictionaryError}
					selectedText={selectedText}
				/>
			)
		} else {
			return (
				<Preview
					text={currentSavedText || ''}
					isMaximized={isMaximized}
					config={previewConfig}
					onFocusMode={optimizedHandleFocusMode}
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
		isMaximized,
		previewConfig,
		optimizedHandleFocusMode,
		handleInternalPageInfoChange,
		initialText,
		currentNotSavedText,
		setInitialText,
		handleSnapshotSelect,
		selectedText,
		dictionaryResult,
		isDictionaryLoading,
		dictionaryError,
	])

	return (
		<aside
			ref={containerRef}
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
				<div className={styles.pageNumberBar} role="status" aria-live="polite">
					<output
						className={styles.pageNumber}
						aria-label={`現在のページ: ${currentPageInfo.currentPage}、全ページ数: ${currentPageInfo.totalPages}`}
					>
						{currentPageInfo.currentPage} / {currentPageInfo.totalPages} ページ
					</output>
				</div>
			)}

			{/* 履歴詳細ダイアログ */}
			<HistoryDetailDialog
				isOpen={showHistoryDetailDialog}
				onClose={handleCloseHistoryDialog}
				selectedSnapshotId={selectedSnapshotId}
				textHistory={textHistory}
				onRestore={onRestoreHistory}
			/>
		</aside>
	)
}
