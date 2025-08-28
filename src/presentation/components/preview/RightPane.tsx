import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { PreviewMode, LayoutConfig, TextSnapshot } from '../../../domain'
import { Preview } from './preview/Preview'
import { Diff2HtmlAdapter } from '../../../infra'
import { useFocusTrap, useOptimizedPreviewLayout } from '../../hooks'
import {
	calculateElementScale,
	calculateScaleWithViewport,
	ScaleInfo,
} from '../../../utils/scaleCalculator'
import { wordCounter, formatNumber } from '@/utils'
import { html as diff2html, parse as diffParse } from 'diff2html'
import 'diff2html/bundles/css/diff2html.min.css'
import { TabPanel, TabItem } from '../'
import { TextHistoryTimeline, HistoryDetailDialog } from './'
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
}) => {
	const [mode, setMode] = useState<PreviewMode>(PreviewMode.VERTICAL)
	const [selectedSnapshotId, setSelectedSnapshotId] = useState<string | undefined>()
	const [showHistoryDetailDialog, setShowHistoryDetailDialog] = useState(false)
	const [isFocusMode, setIsFocusMode] = useState(false)
	const [currentPageInfo, setCurrentPageInfo] = useState({ currentPage: 1, totalPages: 1 })

	// 倍率計算の状態
	const [scaleInfo, setScaleInfo] = useState<ScaleInfo>({
		zoom: 1,
		transformScale: 1,
		totalScale: 1,
		viewportScale: 1,
	})
	const containerRef = useRef<HTMLDivElement>(null)

	// 倍率計算のロジック
	const updateScaleInfo = useCallback(() => {
		if (containerRef.current) {
			const newScaleInfo = calculateScaleWithViewport(containerRef.current)
			setScaleInfo(newScaleInfo)

			console.log('[RightPane] Scale info updated:', {
				element: 'RightPane',
				...newScaleInfo,
			})
		}
	}, [])

	// 最適化されたプレビューレイアウト更新フック
	const { updateLayout, updateLayoutImmediate, cleanup: cleanupLayout } = useOptimizedPreviewLayout()

	// ResizeObserverのデバウンス処理（最適化版）
	const resizeTimeoutRef = useRef<NodeJS.Timeout>()
	const debouncedUpdateScaleInfo = useCallback(() => {
		if (resizeTimeoutRef.current) {
			clearTimeout(resizeTimeoutRef.current)
		}
		resizeTimeoutRef.current = setTimeout(() => {
			updateScaleInfo()
			// レイアウト更新も最適化
			updateLayout(containerRef.current)
		}, 100) // 100msのデバウンス
	}, [updateScaleInfo, updateLayout])

	// フォーカスモードハンドラー（最適化版）
	const handleFocusMode = useCallback(
		(focused: boolean) => {
			setIsFocusMode(focused)

			// フォーカス時にレイアウトを最適化
			if (focused && containerRef.current) {
				updateLayout(containerRef.current)
			}
		},
		[updateLayout]
	)

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

	// 倍率計算の初期化と監視（最適化版）
	useEffect(() => {
		// 初期倍率を計算
		updateScaleInfo()

		// ResizeObserverでサイズ変更を監視（デバウンス処理付き）
		if (containerRef.current) {
			const resizeObserver = new ResizeObserver(() => {
				debouncedUpdateScaleInfo()
			})

			resizeObserver.observe(containerRef.current)

			return () => {
				resizeObserver.disconnect()
				if (resizeTimeoutRef.current) {
					clearTimeout(resizeTimeoutRef.current)
				}
				// レイアウト更新のクリーンアップ
				cleanupLayout()
			}
		}
	}, [updateScaleInfo, debouncedUpdateScaleInfo, cleanupLayout])

	// 最大化状態の変更を監視してレイアウトを更新（最適化版）
	useEffect(() => {
		if (isMaximized && containerRef.current) {
			// 最大化時に最適化されたレイアウト更新
			requestAnimationFrame(() => {
				updateScaleInfo()
				updateLayoutImmediate(containerRef.current)
			})
		}
	}, [isMaximized, updateScaleInfo, updateLayoutImmediate])

	// 差分計算を遅延実行（DIFFモードが選択された時のみ）
	const [diffHtml, setDiffHtml] = useState('')
	const diffCalculationTimeoutRef = useRef<NodeJS.Timeout>()

	// DIFFモードが選択された時のみ差分を計算（デバウンス処理付き）
	useEffect(() => {
		if (mode === PreviewMode.DIFF) {
			// デバウンス処理でパフォーマンスを最適化
			if (diffCalculationTimeoutRef.current) {
				clearTimeout(diffCalculationTimeoutRef.current)
			}

			diffCalculationTimeoutRef.current = setTimeout(() => {
				try {
					// 初回起動時やファイルが存在しない場合
					if (!initialText || !currentNotSavedText) {
						setDiffHtml(`
							<div class="no-diff">
								<p>比較対象がありません</p>
							</div>
						`)
						return
					}

					// 差分計算を実行
					const unifiedDiff = diffService.generateUnifiedDiff(
						'initial',
						'current',
						initialText,
						currentNotSavedText
					)

					// 差分があるかチェック
					if (unifiedDiff) {
						// 変更がある場合
						const beforeStats = wordCounter(initialText || '')
						const afterStats = wordCounter(currentNotSavedText || '')

						// diff2htmlでHTMLを生成
						const diffJson = diffParse(unifiedDiff)
						const diffHtmlResult = diff2html(diffJson, {
							drawFileList: false,
							matching: 'lines',
							outputFormat: 'line-by-line',
						})

						setDiffHtml(`
							<div class="diff-container">
								<div class="diff-header">
									<div class="diff-info">
										<span className=${styles.beforeText}>
											修正前: ${formatNumber(beforeStats.characterCount)}文字
										</span>
										<span className=${styles.afterText}>
											修正後: ${formatNumber(afterStats.characterCount)}文字
										</span>
										<span className=${styles.changeCount}>
											変更: ${formatNumber(Math.abs(afterStats.characterCount - beforeStats.characterCount))}文字
										</span>
									</div>
								</div>
								${diffHtmlResult}
							</div>
						`)
					} else {
						// 変更がない場合
						const currentStats = wordCounter(currentNotSavedText || '')
						setDiffHtml(`
							<div class="no-diff">
								<p>変更はありません。</p>
								<p>現在の文字数: ${formatNumber(currentStats.characterCount)}文字</p>
							</div>
						`)
					}
				} catch (error) {
					console.error('差分計算エラー:', error)
					setDiffHtml(`
						<div class="error-message">
							<p>差分の計算中にエラーが発生しました</p>
						</div>
					`)
				}
			}, 100) // 300msのデバウンス

			return () => {
				if (diffCalculationTimeoutRef.current) {
					clearTimeout(diffCalculationTimeoutRef.current)
				}
			}
		}
	}, [mode, initialText, currentNotSavedText, diffService, wordCounter, formatNumber])

	const charsPerLine = useMemo(() => {
		return previewSetting.charsPerLine
	}, [previewSetting])

	const linesPerPage = useMemo(() => {
		return previewSetting.linesPerPage
	}, [previewSetting])

	const fontFamily = useMemo(() => {
		return previewSetting.fontFamily
	}, [previewSetting])

	const fontSize = useMemo(() => {
		return previewSetting.fontSize
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
			// 修正前後のテキスト情報を計算

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
					text={currentSavedText || ''}
					isMaximized={isMaximized}
					config={{ charsPerLine, linesPerPage, fontSize, fontFamily }}
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
		isMaximized,
		fontFamily,
		fontSize,
		charsPerLine,
		linesPerPage,
		handleFocusMode,
		handleInternalPageInfoChange,
		initialText,
		currentNotSavedText,
		setInitialText,
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
				onClose={() => setShowHistoryDetailDialog(false)}
				selectedSnapshotId={selectedSnapshotId}
				textHistory={textHistory}
				onRestore={onRestoreHistory}
			/>
		</aside>
	)
}
