import { useCallback, useEffect, useState } from 'react'
import {
	Toolbar,
	SwipeIndicator,
	Resizer,
	ThemeEditDialog,
	LayoutRenderer,
	ExportDialog,
	LayerIcon,
} from '../components'
import {
	useCharCount,
	useTextHistory,
	useAutoSave,
	useSwipeGesture,
	useResizable,
	useDraggableLayout,
} from '../hooks'
import {
	DISPLAY_MODE,
	Settings,
	TextSnapshot,
	LayoutConfig,
	EditorSettings,
	EditorUIState,
} from '../../domain'
import { saveText, loadText } from '../../usecases'
import { editorService } from '../../application'
import { hexToRgba, isMobile } from '../../utils'
import styles from './MainLayout.module.css'

interface EditorPageProps {
	initSettings: Settings
}

export const EditorPage: React.FC<EditorPageProps> = ({ initSettings: Settings }) => {
	const [editorSettings, setEditorSettings] = useState<EditorSettings>(Settings.editor)
	const [previewSettings, setPreviewSettings] = useState<LayoutConfig>(Settings.preview)
	const [viewMode, setViewMode] = useState<DISPLAY_MODE>(DISPLAY_MODE.BOTH)
	const [focusedPane, setFocusedPane] = useState<DISPLAY_MODE>(DISPLAY_MODE.BOTH)

	const handleMaximize = useCallback((target: DISPLAY_MODE) => {
		setViewMode(prevViewMode => (prevViewMode === target ? DISPLAY_MODE.BOTH : target))
	}, [])

	const [uiState, setUIState] = useState<EditorUIState>({
		showToolbar: true,
		showPreview: true,
	})

	// ドラッグ可能レイアウトモードの状態
	const [isDraggableMode, setIsDraggableMode] = useState(false)

	// z-index管理（最後にフォーカスしたコンポーネントを上に表示）
	const [focusedContainer, setFocusedContainer] = useState<'editor' | 'preview'>('preview')

	// z-indexを計算する関数
	const getZIndex = useCallback(
		(containerType: 'editor' | 'preview') => {
			// ドラッグ終了したコンテナが上に来るように調整
			const unfocusedZIndex = 50 // フォーカスされていないコンテナ
			const focusedZIndex = 100 // フォーカスされているコンテナ（ドラッグ終了したもの）
			return focusedContainer === containerType ? focusedZIndex : unfocusedZIndex
		},
		[focusedContainer]
	)
	const [editorPosition, setEditorPosition] = useState({ x: 20, y: 200 })
	const [editorSize, setEditorSize] = useState({ width: 800, height: 600 })
	const [previewPosition, setPreviewPosition] = useState({ x: 620, y: 200 })
	const [previewSize, setPreviewSize] = useState({ width: 600, height: 400 })

	// テーマ編集ダイアログの表示状態
	const [showThemeEditDialog, setShowThemeEditDialog] = useState(false)

	// 書き出しダイアログの表示状態
	const [showExportDialog, setShowExportDialog] = useState(false)

	// プレビューのページ情報
	const [pageInfo, setPageInfo] = useState({ currentPage: 1, totalPages: 1 })

	// ページ情報更新のコールバック
	const handlePageInfoChange = useCallback((currentPage: number, totalPages: number) => {
		setPageInfo({ currentPage, totalPages })
	}, [])

	// 初期化時にCSS変数を設定
	useEffect(() => {
		document.documentElement.style.setProperty('--app-bg-color', editorSettings.backgroundColor)
		document.documentElement.style.setProperty('--app-text-color', editorSettings.textColor)
		const bgColorAlpha = hexToRgba(editorSettings.backgroundColor, 0.15)
		document.documentElement.style.setProperty('--app-bg-color-alpha', bgColorAlpha)
	}, [editorSettings.backgroundColor, editorSettings.textColor])

	// ツールバーの表示状態を管理（input操作中は固定）
	const [toolbarDisplayMode, setToolbarDisplayMode] = useState<DISPLAY_MODE>(DISPLAY_MODE.BOTH)

	// エディターサイズの初期化
	const [currentEditorSize, setCurrentEditorSize] = useState(50)

	const onChangeToolbarDisplayMode = useCallback(
		(displayMode: DISPLAY_MODE) => {
			if (focusedPane === DISPLAY_MODE.BOTH) return
			setToolbarDisplayMode(displayMode)
		},
		[focusedPane]
	)

	const [currentSavedText, setCurrentSavedText] = useState('')
	const [lastSavedText, setLastSavedText] = useState('')
	const { currentNotSavedText, charCount, updateText } = useCharCount()
	const { history, saveSnapshot, getLatestSnapshot, getPreviousSnapshot } = useTextHistory(20)

	// Auto save機能
	const handleAutoSave = useCallback(
		(content: string) => {
			setLastSavedText(content)
			setCurrentSavedText(content)
			// 自動保存時にスナップショットを追加
			saveSnapshot(content, `自動保存 - ${new Date().toLocaleString('ja-JP')}`)
		},
		[saveSnapshot]
	)

	const { forceSave } = useAutoSave(currentNotSavedText, {
		enabled: editorSettings.autoSave.enabled,
		delay: editorSettings.autoSave.delay,
		fileName: 'document.json',
		onSave: handleAutoSave,
	})

	// 履歴復元機能
	const handleRestoreHistory = useCallback(
		(snapshot: TextSnapshot) => {
			setCurrentSavedText(snapshot.content)
			setLastSavedText(snapshot.content)
			// エディタの内容も更新
			updateText(snapshot.content)
			// 履歴に復元操作を記録
			saveSnapshot(snapshot.content, `復元 - ${snapshot.description || '履歴から復元'}`)
		},
		[saveSnapshot, updateText]
	)

	// ファイル読み込み機能
	const handleFileLoad = useCallback(
		(content: string, fileName: string) => {
			setCurrentSavedText(content)
			setLastSavedText(content)
			updateText(content)
			// 履歴にファイル読み込みを記録
			saveSnapshot(content, `ファイル読み込み - ${fileName}`)
		},
		[saveSnapshot, updateText]
	)

	// テーマ編集ダイアログを閉じる
	const handleCloseThemeEditDialog = useCallback(() => {
		setShowThemeEditDialog(false)
	}, [])

	// テーマ設定を更新
	const handleThemeUpdate = useCallback(
		(backgroundColor: string, textColor: string) => {
			// CSS変数を更新
			document.documentElement.style.setProperty('--app-bg-color', backgroundColor)
			document.documentElement.style.setProperty('--app-text-color', textColor)
			const bgColorAlpha = hexToRgba(backgroundColor, 0.15)
			document.documentElement.style.setProperty('--app-bg-color-alpha', bgColorAlpha)

			const updatedSettings = {
				...editorSettings,
				backgroundColor,
				textColor,
			}
			setEditorSettings(updatedSettings)
			setShowThemeEditDialog(false)
		},
		[editorSettings]
	)

	useEffect(() => {
		;(async () => {
			const initialText = await loadText('document.json')
			setCurrentSavedText(initialText)
			setLastSavedText(initialText)
			// エディタの初期化完了を待ってからテキストを設定
			setTimeout(() => {
				updateText(initialText)
			}, 100)
		})()
	}, [])

	useEffect(() => {
		onChangeToolbarDisplayMode(focusedPane)
	}, [focusedPane])

	//手動保存機能（Cmd+S / Ctrl+S）
	useEffect(() => {
		const handleKeyDown = async (e: KeyboardEvent) => {
			if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 's') {
				e.preventDefault()
				// forceSaveを使用してauto saveタイマーをリセット＆即座に保存
				await forceSave()
				// 手動保存時のスナップショットを追加
				saveSnapshot(currentNotSavedText, `手動保存 - ${new Date().toLocaleString('ja-JP')}`)
			}
		}
		window.addEventListener('keydown', handleKeyDown)

		return () => window.removeEventListener('keydown', handleKeyDown)
	}, [currentNotSavedText, saveSnapshot, forceSave])

	const onChangeText = useCallback(
		(v: string) => {
			updateText(v)
		},
		[updateText]
	)

	// スワイプジェスチャーでUI制御（モバイル端末のみ）
	const handleSwipe = useCallback(
		(direction: any) => {
			if (!isMobile()) return

			if (direction.up) {
				// 上スワイプ：ツールバーを非表示
				if (uiState.showToolbar) {
					setUIState(editorService.toggleToolbar(uiState))
				}
			} else if (direction.down) {
				// 下スワイプ：ツールバーを表示
				if (!uiState.showToolbar) {
					setUIState(editorService.toggleToolbar(uiState))
				}
			} else if (direction.left && viewMode === DISPLAY_MODE.BOTH) {
				// 左スワイプ：プレビューを非表示
				if (uiState.showPreview) {
					setUIState(editorService.togglePreview(uiState))
				}
			} else if (direction.right && viewMode === DISPLAY_MODE.BOTH) {
				// 右スワイプ：プレビューを表示
				if (!uiState.showPreview) {
					setUIState(editorService.togglePreview(uiState))
				}
			}
		},
		[uiState, viewMode]
	)

	// スワイプジェスチャーを有効化
	useSwipeGesture({
		threshold: 80, // スワイプ検出の最小距離
		velocityThreshold: 0.5, // スワイプ検出の最小速度
		onSwipe: handleSwipe,
	})

	// リサイザーを初期化
	const {
		isDragging,

		isKeyboardMode,
		announceText,
		containerRef,
		resizerRef,
		resizerProps,
		setSize,
	} = useResizable({
		initialSize: 50, // 50%で開始
		minSize: 20, // 最小20%
		maxSize: 80, // 最大80%
		step: 5, // キーボード操作時のステップ
		label: 'エディタとプレビューのサイズ調整',
		onResize: newSize => {
			setCurrentEditorSize(newSize)
		},
	})

	// ドラッグ可能レイアウトの設定
	const { layoutType, getEditorContainerConfig, getPreviewContainerConfig } = useDraggableLayout(
		{
			editorPosition,
			editorSize,
			previewPosition,
			previewSize,
			setEditorPosition,
			setEditorSize,
			setPreviewPosition,
			setPreviewSize,
		},
		{ isDraggableMode, viewMode, charCount, pageInfo }
	)

	// 共通のハンドラー関数
	const handleFocusEditor = useCallback(() => {
		setFocusedPane(DISPLAY_MODE.EDITOR)
		setFocusedContainer('editor') // z-index管理用
	}, [])
	const handleFocusPreview = useCallback(() => {
		setFocusedPane(DISPLAY_MODE.PREVIEW)
		setFocusedContainer('preview') // z-index管理用
	}, [])
	const handleMaximizeEditor = useCallback(() => {
		handleMaximize(DISPLAY_MODE.EDITOR)
	}, [handleMaximize])
	const handleMaximizePreview = useCallback(() => {
		handleMaximize(DISPLAY_MODE.PREVIEW)
	}, [handleMaximize])

	// 書き出しダイアログのハンドラー
	const handleOpenExportDialog = useCallback(() => {
		setShowExportDialog(true)
	}, [])

	const handleCloseExportDialog = useCallback(() => {
		setShowExportDialog(false)
	}, [])

	return (
		<div
			style={{
				position: 'fixed',
				top: 0,
				left: 0,
				right: 0,
				bottom: 0,
				width: '100vw',
				height: '100vh',
				overflow: 'hidden',
			}}
		>
			<main
				className={styles.animatedContainer}
				style={{
					display: 'flex',
					flexDirection: 'column',
					width: '100%',
					height: '100%',
					position: 'relative',
				}}
			>
				{/* ツールバー */}
				<section
					className={`${styles.toolbarContainer} ${uiState.showToolbar ? styles.visible : styles.hidden}`}
					style={{ display: 'flex', flexDirection: 'column' }}
				>
					<Toolbar
						activePane={toolbarDisplayMode}
						visible={uiState.showToolbar}
						editorSettings={editorSettings}
						previewSettings={previewSettings}
						currentText={currentNotSavedText}
						currentSavedText={currentSavedText}
						onEditorSettingChange={setEditorSettings}
						onPreviewSettingChange={setPreviewSettings}
						onToolbarFocusChange={onChangeToolbarDisplayMode}
						onFileLoad={handleFileLoad}
						onThemeEdit={() => setShowThemeEditDialog(true)}
						onExportOpen={handleOpenExportDialog}
						themeColors={{
							backgroundColor: editorSettings.backgroundColor,
							textColor: editorSettings.textColor,
						}}
					/>
				</section>

				{/* ツールバー切替ボタン */}
				<button
					className={styles.toolbarToggle}
					onClick={() => setUIState(editorService.toggleToolbar(uiState))}
					aria-label={uiState.showToolbar ? 'ツールバーを閉じる' : 'ツールバーを開く'}
				>
					{uiState.showToolbar ? '▲' : '▼'}
				</button>

				{/* ドラッグ可能モード切替ボタン */}
				<button
					className={styles.layoutToggle}
					onClick={() => setIsDraggableMode(!isDraggableMode)}
					aria-label={isDraggableMode ? '固定レイアウトに切り替え' : 'ドラッグ可能レイアウトに切り替え'}
				>
					<LayerIcon isDraggable={isDraggableMode} />
				</button>
				{/* メインコンテンツレンダリング */}
				{viewMode === DISPLAY_MODE.BOTH && (
					<LayoutRenderer
						layoutType={layoutType as any}
						editorSettings={editorSettings}
						currentNotSavedText={currentNotSavedText}
						onChangeText={onChangeText}
						onFocusEditor={handleFocusEditor}
						onMaximizeEditor={handleMaximizeEditor}
						currentSavedText={currentSavedText}
						lastSavedText={lastSavedText}
						previewSettings={previewSettings}
						textHistory={history}
						onFocusPreview={handleFocusPreview}
						onMaximizePreview={handleMaximizePreview}
						onRestoreHistory={handleRestoreHistory}
						currentEditorSize={currentEditorSize}
						isDragging={isDragging}
						onPageInfoChange={handlePageInfoChange}
						{...(layoutType === 'fixed'
							? {
									showPreview: uiState.showPreview,
									containerRef,
									resizerElement: uiState.showPreview && (
										<Resizer
											isDragging={isDragging}
											isKeyboardMode={isKeyboardMode}
											announceText={announceText}
											size={currentEditorSize}
											resizerRef={resizerRef}
											{...resizerProps}
										/>
									),
								}
							: {
									editorContainerConfig: getEditorContainerConfig(
										false,
										getZIndex('editor'),
										handleFocusEditor
									),
									previewContainerConfig: getPreviewContainerConfig(
										false,
										getZIndex('preview'),
										handleFocusPreview
									),
									containerClassName: styles.draggableArea,
								})}
					/>
				)}

				{/* エディター最大化 */}
				{viewMode === DISPLAY_MODE.EDITOR && (
					<LayoutRenderer
						layoutType={layoutType as any}
						editorSettings={editorSettings}
						currentNotSavedText={currentNotSavedText}
						onChangeText={onChangeText}
						onFocusEditor={handleFocusEditor}
						onMaximizeEditor={handleMaximizeEditor}
						currentSavedText={currentSavedText}
						lastSavedText={lastSavedText}
						previewSettings={previewSettings}
						textHistory={history}
						onFocusPreview={handleFocusPreview}
						onMaximizePreview={handleMaximizePreview}
						onRestoreHistory={handleRestoreHistory}
						currentEditorSize={currentEditorSize}
						isDragging={isDragging}
						onPageInfoChange={handlePageInfoChange}
						{...(layoutType === 'fixed'
							? {
									showPreview: false,
									containerRef,
									resizerElement: null,
								}
							: {
									editorContainerConfig: getEditorContainerConfig(
										true,
										getZIndex('editor'),
										handleFocusEditor
									),
									containerClassName: styles.draggableArea,
								})}
					/>
				)}

				{/* プレビュー最大化 */}
				{viewMode === DISPLAY_MODE.PREVIEW && (
					<LayoutRenderer
						layoutType={layoutType as any}
						editorSettings={editorSettings}
						currentNotSavedText={currentNotSavedText}
						onChangeText={onChangeText}
						onFocusEditor={handleFocusEditor}
						onMaximizeEditor={handleMaximizeEditor}
						currentSavedText={currentSavedText}
						lastSavedText={lastSavedText}
						previewSettings={previewSettings}
						textHistory={history}
						onFocusPreview={handleFocusPreview}
						onMaximizePreview={handleMaximizePreview}
						onRestoreHistory={handleRestoreHistory}
						currentEditorSize={currentEditorSize}
						isDragging={isDragging}
						onPageInfoChange={handlePageInfoChange}
						{...(layoutType === 'fixed'
							? {
									showEditor: false,
									showPreview: true,
									containerRef,
									resizerElement: null,
								}
							: {
									previewContainerConfig: getPreviewContainerConfig(
										true,
										getZIndex('preview'),
										handleFocusPreview
									),
									containerClassName: styles.draggableArea,
								})}
					/>
				)}
			</main>

			{/* モバイル端末用スワイプインジケーター */}
			<SwipeIndicator
				showToolbar={uiState.showToolbar}
				showPreview={uiState.showPreview}
				viewMode={viewMode}
			/>

			{/* テーマ編集ダイアログ */}
			<ThemeEditDialog
				isOpen={showThemeEditDialog}
				onClose={handleCloseThemeEditDialog}
				onThemeUpdate={handleThemeUpdate}
				themeColors={{
					backgroundColor: editorSettings.backgroundColor,
					textColor: editorSettings.textColor,
				}}
			/>

			{/* 書き出しダイアログ */}
			<ExportDialog
				isOpen={showExportDialog}
				onClose={handleCloseExportDialog}
				currentSavedText={currentSavedText}
				previewSettings={previewSettings}
			/>
		</div>
	)
}
