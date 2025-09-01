import React, { useCallback, useEffect, useState } from 'react'
import { logger } from '@/utils/logger'
import { useMainLayoutState } from '../hooks/useMainLayoutState'
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
import { DISPLAY_MODE, Settings, TextSnapshot, LayoutConfig, EditorSettings } from '../../domain'

import { EditorUIState } from '../../domain'
import { loadText } from '../../usecases'
import { editorService } from '../../application'
import { eventBus, EVENTS } from '../../application/observers/EventBus'
import { commandManager } from '../../application/commands/CommandManager'
import { saveEditorSettings } from '../../usecases/SaveEditorSettings'
import { serviceFactory } from '../../infra'
import { hexToRgba, isMobile, isMobileSize } from '../../utils'
import styles from './MainLayout.module.css'
import { SwipeDirection } from '../hooks/useSwipeGesture'

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
		focusedContainer,
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
		setViewMode,
		setFocusedPane,
		setIsEditorMaximized,
		setIsPreviewMaximized,
		setUIState,
		setIsDraggableMode,
		setFocusedContainer,
		setEditorPosition,
		setEditorSize,
		setPreviewPosition,
		setPreviewSize,
		setShowThemeEditDialog,
		setShowExportDialog,
		setPageInfo,
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
		getMaximizedState,
		getZIndex,
		handlePageInfoChange,
	} = useMainLayoutState({ initSettings })

	// 初期化状態の管理
	const [isInitialized, setIsInitialized] = useState(false)

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

	const { forceSave, isSaving } = useAutoSave(currentNotSavedText, {
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
	// テーマ編集ダイアログを閉じる
	const handleSetInitialText = useCallback(
		(text: string) => {
			setInitialText(text)
		},
		[setInitialText]
	)

	// ファイル読み込み機能
	const handleFileLoad = useCallback(
		(content: string, fileName: string) => {
			// 読み込んだテキストを初期状態として保存
			setCurrentSavedText(content)
			setLastSavedText(content)
			// エディタの内容も更新
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

			// 初回起動時の状態設定
			if (initialText) {
				// ファイルが存在する場合
				setInitialText(initialText)
				setCurrentSavedText(initialText)
				setLastSavedText(initialText)
				// エディタの初期化完了を待ってからテキストを設定
				setTimeout(() => {
					updateText(initialText)
					setIsInitialized(true)
				}, 100)
			} else {
				// 初回起動時（ファイルが存在しない場合）
				setCurrentSavedText('')
				setLastSavedText('') // 明示的に空文字列を設定
			}

			// エディタの初期化完了を待ってからテキストを設定
			setTimeout(() => {
				updateText(initialText)
			}, 100)
		})()
	}, [])

	useEffect(() => {
		onChangeToolbarDisplayMode(focusedPane)
	}, [focusedPane])

	// 設定の自動保存
	useEffect(() => {
		const saveSettings = async () => {
			try {
				const fileDataRepository = serviceFactory.getFileDataRepository()
				const fullSettings = {
					editor: editorSettings,
					preview: previewSettings,
				}
				await saveEditorSettings(fileDataRepository, fullSettings)
				logger.debug('MainLayout', 'Settings auto-saved successfully')
			} catch (error) {
				logger.error('MainLayout', 'Failed to auto-save settings', error)
			}
		}

		// 初期化完了後にのみ自動保存を有効化
		if (isInitialized) {
			saveSettings()
		}
	}, [editorSettings, previewSettings, isInitialized])

	//手動保存機能（Cmd+S / Ctrl+S）
	useEffect(() => {
		const handleKeyDown = async (e: KeyboardEvent) => {
			if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 's') {
				e.preventDefault()

				// 既に保存処理中の場合は何もしない
				if (isSaving) {
					return
				}

				try {
					logger.info('MainLayout', 'Manual save triggered with content', currentNotSavedText)

					// forceSaveを使用してauto saveタイマーをリセット＆即座に保存
					await forceSave()

					// 手動保存成功時に状態を更新（空文字でも更新）
					setLastSavedText(currentNotSavedText)
					setCurrentSavedText(currentNotSavedText)

					// イベントバスで保存完了を通知
					eventBus.publish(EVENTS.TEXT_SAVED, {
						timestamp: Date.now(),
						contentLength: currentNotSavedText.length,
					})

					// 手動保存時のスナップショットを追加（空文字でも記録）
					saveSnapshot(currentNotSavedText, `手動保存 - ${new Date().toLocaleString('ja-JP')}`)

					logger.info('MainLayout', 'Manual save completed successfully')
				} catch (error) {
					logger.error('MainLayout', 'Manual save failed', error)
					eventBus.publish(EVENTS.ERROR_OCCURRED, {
						error: error instanceof Error ? error.message : String(error),
						operation: 'manual_save',
					})
				}
			}
		}
		window.addEventListener('keydown', handleKeyDown)

		return () => window.removeEventListener('keydown', handleKeyDown)
	}, [currentNotSavedText, saveSnapshot, forceSave, isSaving])

	// テキスト変更時の処理
	const onChangeText = useCallback(
		(v: string) => {
			updateText(v)
		},
		[updateText]
	)

	// mobileでのみ最新の書き込みをcurrentSaveTextに常に保存
	// PCでは通常の自動保存機能を使用し、mobileではリアルタイムでcurrentSaveTextを更新
	useEffect(() => {
		if (isMobile() && currentNotSavedText !== '') {
			// mobileの場合、テキストが変更されるたびにcurrentSaveTextを更新
			// デバウンス処理でパフォーマンスを最適化
			const timeoutId = setTimeout(() => {
				logger.info('MainLayout', 'Mobile auto-save: updating currentSaveText')
				setCurrentSavedText(currentNotSavedText)
			}, 300) // 300msのデバウンス

			return () => clearTimeout(timeoutId)
		}
	}, [currentNotSavedText])

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
