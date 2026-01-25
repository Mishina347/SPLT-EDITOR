import React, { useCallback, useEffect, useState } from 'react'
import { logger } from '@/utils/logger'
import { useMainLayoutState } from '../hooks'
import {
	Toolbar,
	SwipeIndicator,
	Resizer,
	ThemeEditDialog,
	LayoutRenderer,
	ExportDialog,
	LayerIcon,
	Dialog,
} from '../components'
import { SaveDialog } from '../components/toolbar/save/SaveDialog'
import {
	useCharCount,
	useTextHistory,
	useSwipeGesture,
	useResizable,
	useDraggableLayout,
} from '../hooks'
import { DISPLAY_MODE, Settings, TextSnapshot } from '@/domain'

import { editorService } from '../../application'
import { SwipeDirection } from '../hooks/common/useSwipeGesture'
import {
	useFileOperations,
	useDialogState,
	useEventHandlers,
	useAppInitialization,
	useEditorInputSave,
} from './hooks'
import { hexToRgba, isMobile, isMobileSize, isTauri } from '@/utils'
import styles from './MainLayout.module.css'

interface EditorPageProps {
	initSettings: Settings
}

export const EditorPage: React.FC<EditorPageProps> = ({ initSettings }) => {
	// カスタムフックで状態管理
	const {
		// 状態
		editorSettings,
		previewSettings,
		viewMode,
		focusedPane,
		isEditorMaximized,
		isPreviewMaximized,
		uiState,
		isDraggableMode,
		editorPosition,
		editorSize,
		previewPosition,
		previewSize,
		showThemeEditDialog,
		showExportDialog,
		pageInfo,
		currentSavedText,
		initialText,
		lastSavedText,
		toolbarDisplayMode,
		currentEditorSize,
		lastDraggableEditorSize,
		lastDraggablePreviewSize,

		// セッター
		setEditorSettings,
		setPreviewSettings,
		setFocusedPane,
		setUIState,
		setIsDraggableMode,
		setFocusedContainer,
		setEditorPosition,
		setEditorSize,
		setPreviewPosition,
		setPreviewSize,
		setShowThemeEditDialog,
		setShowExportDialog,
		setCurrentSavedText,
		setInitialText,
		setLastSavedText,
		setToolbarDisplayMode,
		setCurrentEditorSize,
		setLastDraggableEditorSize,
		setLastDraggablePreviewSize,

		// ハンドラー
		handleMaximize,
		resetMaximizedState,
		getZIndex,
		handlePageInfoChange,
	} = useMainLayoutState({ initSettings })

	// 初期化状態の管理
	const [isInitialized, setIsInitialized] = useState(false)
	// 保存確認モーダル用の状態
	const [showSaveConfirm, setShowSaveConfirm] = useState(false)
	// ファイルパス管理（nullの場合は未保存）
	const [currentFilePath, setCurrentFilePath] = useState<string | null>(null)
	// 保存ダイアログの表示状態
	const [showSaveDialog, setShowSaveDialog] = useState(false)
	const pendingActionRef = React.useRef<null | (() => void)>(null)
	const setPendingAction = (action: (() => void) | null) => {
		pendingActionRef.current = action
	}

	const { currentNotSavedText, charCount, updateText } = useCharCount()
	const { history, saveSnapshot } = useTextHistory(20)

	// 選択範囲の文字数情報
	const [selectionCharCount, setSelectionCharCount] = useState<
		| {
				selectedText: string
				characterCount: number
				lineCount: number
				pageCount: number
		  }
		| undefined
	>()

	// 選択範囲の変更ハンドラー
	const handleSelectionChange = useCallback(
		(selectionCharCount: {
			selectedText: string
			characterCount: number
			lineCount: number
			pageCount: number
		}) => {
			logger.debug(
				'MainLayout',
				`Selection change received: ${selectionCharCount.characterCount} chars`
			)
			setSelectionCharCount(selectionCharCount)
		},
		[]
	)

	// ブラウザのページ離脱前の保存確認（beforeunload）
	useEffect(() => {
		if (isTauri()) return // Tauri環境では不要
		const handleBeforeUnload = (e: BeforeUnloadEvent) => {
			// currentNotSavedText: 現在編集中のテキスト（未保存）
			// lastSavedText: 最後に保存したテキスト
			const hasUnsavedChanges = currentNotSavedText !== lastSavedText
			if (hasUnsavedChanges) {
				e.preventDefault()
				// Chrome等では returnValue に空文字以外でもよいが、仕様上空文字を設定
				e.returnValue = ''
				return ''
			}
		}

		window.addEventListener('beforeunload', handleBeforeUnload)
		return () => {
			window.removeEventListener('beforeunload', handleBeforeUnload)
		}
	}, [currentNotSavedText, lastSavedText])

	// ブラウザ環境でのページ更新/タブ閉じる前のカスタム保存確認
	useEffect(() => {
		if (isTauri()) return // Tauri環境では不要

		const handleKeyDown = (e: KeyboardEvent) => {
			// F5キーまたはCtrl+R/Cmd+Rでページ更新
			if (e.key === 'F5' || ((e.ctrlKey || e.metaKey) && e.key === 'r')) {
				const hasUnsavedChanges = currentNotSavedText !== lastSavedText
				if (hasUnsavedChanges) {
					e.preventDefault()
					pendingActionRef.current = () => {
						window.location.reload()
					}
					setShowSaveConfirm(true)
				}
			}
		}

		window.addEventListener('keydown', handleKeyDown)
		return () => {
			window.removeEventListener('keydown', handleKeyDown)
		}
	}, [currentNotSavedText, lastSavedText])

	// スマホサイズの場合はドラッグ可能モードを無効化
	useEffect(() => {
		const handleResize = () => {
			if (isMobileSize()) {
				setIsDraggableMode(false)
			}
		}

		// 初期チェック
		handleResize()

		// リサイズイベントリスナーを追加
		window.addEventListener('resize', handleResize)

		return () => {
			window.removeEventListener('resize', handleResize)
		}
	}, [setIsDraggableMode])

	// 初期化時にCSS変数を設定
	useEffect(() => {
		document.documentElement.style.setProperty('--app-bg-color', editorSettings.backgroundColor)
		document.documentElement.style.setProperty('--app-text-color', editorSettings.textColor)
		const bgColorAlpha = hexToRgba(editorSettings.backgroundColor, 0.15)
		document.documentElement.style.setProperty('--app-bg-color-alpha', bgColorAlpha)
	}, [editorSettings.backgroundColor, editorSettings.textColor])

	// draggableモードの変更を監視してサイズを復元
	useEffect(() => {
		if (isDraggableMode) {
			// draggableモードが有効になった時、最後のサイズを復元
			if (lastDraggableEditorSize.width !== 800 || lastDraggableEditorSize.height !== 600) {
				setEditorSize(lastDraggableEditorSize)
			}
			if (lastDraggablePreviewSize.width !== 600 || lastDraggablePreviewSize.height !== 400) {
				setPreviewSize(lastDraggablePreviewSize)
			}
		}
	}, [
		isDraggableMode,
		lastDraggableEditorSize,
		lastDraggablePreviewSize,
		setEditorSize,
		setPreviewSize,
	])

	// ウィンドウリサイズ時にdraggableモードのサイズを保持
	useEffect(() => {
		const handleWindowResize = () => {
			if (isDraggableMode) {
				// 現在のサイズを保存
				setLastDraggableEditorSize(editorSize)
				setLastDraggablePreviewSize(previewSize)
			}
		}

		window.addEventListener('resize', handleWindowResize)
		return () => window.removeEventListener('resize', handleWindowResize)
	}, [
		isDraggableMode,
		editorSize,
		previewSize,
		setLastDraggableEditorSize,
		setLastDraggablePreviewSize,
	])

	const onChangeToolbarDisplayMode = useCallback(
		(displayMode: DISPLAY_MODE) => {
			if (focusedPane === DISPLAY_MODE.BOTH) return
			setToolbarDisplayMode(displayMode)
		},
		[focusedPane]
	)

	// 入力時保存ロジック（PWAでは即時、通常はauto save）
	const { onChangeText, isSaving, forceSave } = useEditorInputSave({
		editorSettings,
		currentNotSavedText,
		updateText,
		setLastSavedText,
		setCurrentSavedText,
	})

	// ファイル操作ロジック
	const { initializeApp, handleFileLoad, handleThemeUpdate, saveSettings, saveResizerRatio } =
		useFileOperations({
			editorSettings,
			previewSettings,
			isInitialized,
			setInitialText,
			setCurrentSavedText,
			setLastSavedText,
			updateText,
			setIsInitialized,
			saveSnapshot,
			setCurrentFilePath,
		})

	// ダイアログ状態管理
	const {
		handleCloseThemeEditDialog,
		handleOpenExportDialog,
		handleCloseExportDialog,
		handleConfirmSaveAndContinue,
		handleDiscardAndContinue,
		handleCancelContinue,
	} = useDialogState({
		setShowThemeEditDialog,
		setShowExportDialog,
		setShowSaveConfirm,
		setPendingAction,
	})

	// イベントハンドラ
	useEventHandlers({
		currentNotSavedText,
		lastSavedText,
		isSaving,
		forceSave,
		setCurrentSavedText,
		setLastSavedText,
		setIsDraggableMode,
		setPendingAction,
		setShowSaveConfirm,
		saveSnapshot,
		currentFilePath,
		setCurrentFilePath,
		setShowSaveDialog,
	})

	// アプリ初期化
	useAppInitialization({
		editorSettings,
		isDraggableMode,
		lastDraggableEditorSize,
		lastDraggablePreviewSize,
		setEditorSize,
		setPreviewSize,
		editorSize,
		previewSize,
		setLastDraggableEditorSize,
		setLastDraggablePreviewSize,
		initializeApp,
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
	// テーマ編集ダイアログを閉じる
	const handleSetInitialText = useCallback(
		(text: string) => {
			setInitialText(text)
		},
		[setInitialText]
	)

	// テーマ設定を更新（フックから取得したハンドラーをラップ）
	const handleThemeUpdateWrapper = useCallback(
		async (backgroundColor: string, textColor: string) => {
			await handleThemeUpdate(backgroundColor, textColor, setEditorSettings)
			setShowThemeEditDialog(false)
		},
		[handleThemeUpdate, setEditorSettings]
	)

	// 初期化ロジックは useAppInitialization フックで処理

	useEffect(() => {
		onChangeToolbarDisplayMode(focusedPane)
	}, [focusedPane])

	// 設定の自動保存
	useEffect(() => {
		// 初期化完了後にのみ自動保存を有効化
		if (isInitialized) {
			saveSettings()
		}
	}, [editorSettings, previewSettings, isInitialized, saveSettings])

	// 手動保存、mobile保存、その他イベントハンドラーは useEventHandlers フックで処理

	// スワイプジェスチャーでUI制御（モバイル端末のみ）
	const handleSwipe = useCallback(
		(direction: SwipeDirection) => {
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
	const { isDragging, isKeyboardMode, announceText, containerRef, resizerRef, resizerProps } =
		useResizable({
			initialSize: initSettings.resizerRatio || 60, // 保存された比率または60%で開始
			minSize: 20, // 最小20%
			maxSize: 80, // 最大80%
			step: 2, // キーボード操作時のステップ
			label: 'エディタとプレビューのサイズ調整',
			onResize: newSize => {
				setCurrentEditorSize(newSize)
			},
			onSaveRatio: saveResizerRatio,
		})

	// ドラッグ可能レイアウトの設定
	const { layoutType, getEditorContainerConfig, getPreviewContainerConfig } = useDraggableLayout(
		{
			editorPosition,
			editorSize,
			previewPosition,
			previewSize,
			setEditorPosition: position => {
				setEditorPosition(position)
			},
			setEditorSize: size => {
				setEditorSize(size)
				// draggableモードでのサイズ変更を追跡
				if (isDraggableMode) {
					setLastDraggableEditorSize(size)
				}
			},
			setPreviewPosition: position => {
				setPreviewPosition(position)
			},
			setPreviewSize: size => {
				setPreviewSize(size)
				// draggableモードでのサイズ変更を追跡
				if (isDraggableMode) {
					setLastDraggablePreviewSize(size)
				}
			},
		},
		{ isDraggableMode, viewMode, charCount, pageInfo, selectionCharCount }
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

	// 書き出しダイアログのハンドラー（フックから取得したハンドラーをラップ）
	const handleOpenExportDialogWrapper = useCallback(() => {
		const hasUnsaved = currentNotSavedText !== lastSavedText
		handleOpenExportDialog(hasUnsaved)
	}, [currentNotSavedText, lastSavedText, handleOpenExportDialog])

	// 保存確認モーダルのボタン動作（フックから取得したハンドラーをラップ）
	const handleConfirmSaveAndContinueWrapper = useCallback(async () => {
		await handleConfirmSaveAndContinue(
			forceSave,
			currentNotSavedText,
			setLastSavedText,
			setCurrentSavedText
		)
	}, [
		handleConfirmSaveAndContinue,
		forceSave,
		currentNotSavedText,
		setLastSavedText,
		setCurrentSavedText,
	])

	// beforeunload、close-requested イベントハンドラーは useEventHandlers フックで処理

	return (
		<div className={styles.mainLayout}>
			<main className={styles.animatedContainer}>
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
						onExportOpen={handleOpenExportDialogWrapper}
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

				{/* ドラッグ可能モード切替ボタン（スマホサイズでは非表示） */}
				{!isMobileSize() && (
					<button
						className={styles.layoutToggle}
						onClick={() => {
							setIsDraggableMode(!isDraggableMode)
							// レイアウトモード切り替え時に最大化状態をリセット
							resetMaximizedState()
						}}
						aria-label={isDraggableMode ? '固定レイアウトに切り替え' : 'ドラッグ可能レイアウトに切り替え'}
					>
						<LayerIcon isDraggable={isDraggableMode} />
					</button>
				)}
				{/* メインコンテンツレンダリング */}
				{viewMode === DISPLAY_MODE.BOTH && (
					<LayoutRenderer
						layoutType={layoutType}
						editorSettings={editorSettings}
						currentNotSavedText={currentNotSavedText}
						initialText={initialText}
						setInitialText={handleSetInitialText}
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
						currentPageInfo={pageInfo}
						onSelectionChange={handleSelectionChange}
						selectedText={selectionCharCount?.selectedText}
						// 最大化状態を明示的に渡す
						editorMaximized={isEditorMaximized}
						previewMaximized={isPreviewMaximized}
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
						layoutType={layoutType}
						editorSettings={editorSettings}
						currentNotSavedText={currentNotSavedText}
						initialText={initialText}
						setInitialText={handleSetInitialText}
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
						currentPageInfo={pageInfo}
						onSelectionChange={handleSelectionChange}
						selectedText={selectionCharCount?.selectedText}
						// 最大化状態を明示的に渡す
						editorMaximized={isEditorMaximized}
						previewMaximized={isPreviewMaximized}
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
						layoutType={layoutType}
						editorSettings={editorSettings}
						currentNotSavedText={currentNotSavedText}
						initialText={initialText}
						setInitialText={handleSetInitialText}
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
						currentPageInfo={pageInfo}
						onSelectionChange={handleSelectionChange}
						selectedText={selectionCharCount?.selectedText}
						// 最大化状態を明示的に渡す
						editorMaximized={isEditorMaximized}
						previewMaximized={isPreviewMaximized}
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
				onThemeUpdate={handleThemeUpdateWrapper}
				themeColors={{
					backgroundColor: editorSettings.backgroundColor,
					textColor: editorSettings.textColor,
				}}
			/>

			{/* 保存確認モーダル */}
			<Dialog
				isOpen={showSaveConfirm}
				onClose={handleCancelContinue}
				title="未保存の変更があります"
				constrainToContainer={true}
				maxWidth="520px"
			>
				<div style={{ padding: '8px 4px 0 4px' }}>
					<p style={{ marginBottom: 12 }}>
						現在の編集内容を保存しますか？
						<br />
						保存しない場合、直近の変更は失われます。
					</p>
					<div style={{ display: 'flex', gap: 8, justifyContent: 'flex-end' }}>
						<button className={styles.buttonSecondary} onClick={handleCancelContinue}>
							キャンセル
						</button>
						<button className={styles.buttonDanger} onClick={handleDiscardAndContinue}>
							保存しない
						</button>
						<button className={styles.buttonPrimary} onClick={handleConfirmSaveAndContinueWrapper}>
							保存して続行
						</button>
					</div>
				</div>
			</Dialog>

			{/* 書き出しダイアログ */}
			<ExportDialog
				isOpen={showExportDialog}
				onClose={handleCloseExportDialog}
				currentSavedText={currentSavedText}
				previewSettings={previewSettings}
			/>

			{/* ファイル保存ダイアログ */}
			{!isTauri() && (
				<SaveDialog
					isOpen={showSaveDialog}
					onClose={() => setShowSaveDialog(false)}
					onSave={async (fileName: string) => {
						const { saveTextFile, saveToExistingFile } = await import('@/usecases/file/saveTextFile')
						try {
							if (currentFilePath) {
								// 既存のファイルに保存
								await saveToExistingFile(currentFilePath, currentNotSavedText)
							} else {
								// 新しいファイルとして保存（ブラウザ環境）
								const savedFile = await saveTextFile(currentNotSavedText, fileName)
								setCurrentFilePath(savedFile.filePath)
							}
							// 保存成功時に状態を更新
							setCurrentSavedText(currentNotSavedText)
							setLastSavedText(currentNotSavedText)
							// 履歴に保存操作を記録
							const displayFileName = currentFilePath
								? currentFilePath.split(/[/\\]/).pop() || fileName
								: fileName
							saveSnapshot(currentNotSavedText, `ファイル保存 - ${displayFileName}`)
						} catch (error) {
							if (error instanceof Error && !error.message.includes('キャンセル')) {
								throw error
							}
						}
					}}
					currentText={currentNotSavedText}
				/>
			)}
		</div>
	)
}
