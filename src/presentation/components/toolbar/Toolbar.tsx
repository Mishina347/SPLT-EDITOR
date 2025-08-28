import React, { useState, useCallback, useMemo, useRef, useEffect } from 'react'
import { EditorSettingsPanel } from './editorCongig/EditorSettingsPanel'
import { PreviewSettingsPanel } from './previewConfig/PreviewSettingsPanel'

import { HamburgerMenu } from './HamburgerMenu'
import { LayoutConfig, DISPLAY_MODE, EditorSettings } from '../../../domain'
import styles from './Toolbar.module.css'

interface ToolbarProps {
	activePane: DISPLAY_MODE
	visible: boolean
	editorSettings: EditorSettings
	previewSettings: LayoutConfig
	currentText: string
	currentSavedText: string
	onEditorSettingChange: (settings: EditorSettings) => void
	onPreviewSettingChange: (settings: LayoutConfig) => void
	onToolbarFocusChange: (displayMode: DISPLAY_MODE) => void
	onFileLoad?: (content: string, fileName: string) => void
	onThemeEdit?: () => void
	onExportOpen?: () => void
	themeColors?: {
		backgroundColor: string
		textColor: string
	}
}

export const Toolbar: React.FC<ToolbarProps> = ({
	activePane,
	visible,
	editorSettings,
	previewSettings,
	currentText,
	onEditorSettingChange,
	onPreviewSettingChange,
	onToolbarFocusChange,
	onFileLoad,
	onThemeEdit,
	onExportOpen,
	themeColors,
}) => {
	// アニメーション状態を管理
	const [animationState, setAnimationState] = useState<'idle' | 'entering' | 'exiting'>('idle')
	// アニメーション完了後の可視性を管理
	const [isVisibilityHidden, setIsVisibilityHidden] = useState(!visible)
	// ファイル入力要素を再利用するためのref
	const fileInputRef = useRef<HTMLInputElement | null>(null)
	// ツールバーコンテナのref
	const toolbarRef = useRef<HTMLElement>(null)
	// ツールバーアイテムのref
	const editorPanelRef = useRef<HTMLDivElement>(null)
	const previewPanelRef = useRef<HTMLDivElement>(null)
	const spacerRef = useRef<HTMLDivElement>(null)
	const lastSpacerRef = useRef<HTMLDivElement>(null)

	// スクロール位置の状態管理
	const [canScrollLeft, setCanScrollLeft] = useState(false)
	const [canScrollRight, setCanScrollRight] = useState(false)

	// パネルがはみ出しているかどうかを判定する関数
	const isPanelOverflowing = useCallback((panelRef: React.RefObject<HTMLDivElement>) => {
		if (!panelRef.current || !toolbarRef.current) return false

		const panel = panelRef.current
		const toolbar = toolbarRef.current
		const content = toolbar.querySelector(`.${styles.toolbarContent}`) as HTMLElement

		if (!content) return false

		const panelRect = panel.getBoundingClientRect()
		const contentRect = content.getBoundingClientRect()

		// パネルが左または右にはみ出しているかチェック
		return panelRect.left < contentRect.left || panelRect.right > contentRect.right
	}, [])

	// パネルを確実に見えるようにスクロールする関数
	const scrollToMakePanelVisible = useCallback((panelRef: React.RefObject<HTMLDivElement>) => {
		if (!panelRef.current || !toolbarRef.current) return

		const panel = panelRef.current
		const toolbar = toolbarRef.current
		const content = toolbar.querySelector(`.${styles.toolbarContent}`) as HTMLElement

		if (!content) return

		const panelRect = panel.getBoundingClientRect()
		const contentRect = content.getBoundingClientRect()

		// パネルが左にはみ出している場合
		if (panelRect.left < contentRect.left) {
			const scrollAmount = contentRect.left - panelRect.left + 100 // 100pxの余白
			content.scrollBy({ left: -scrollAmount, behavior: 'smooth' })
		}
		// パネルが右にはみ出している場合
		else if (panelRect.right > contentRect.right) {
			const scrollAmount = panelRect.right - contentRect.right + 100 // 100pxの余白
			content.scrollBy({ left: scrollAmount, behavior: 'smooth' })
		}
	}, [])

	// パネルの表示状態が変更された時に、はみ出しているパネルを自動的に表示
	useEffect(() => {
		// 少し遅延を入れてDOMの更新を待つ
		const timer = setTimeout(() => {
			if (activePane === DISPLAY_MODE.PREVIEW && isPanelOverflowing(lastSpacerRef)) {
				scrollToMakePanelVisible(lastSpacerRef)
			} else if (activePane === DISPLAY_MODE.EDITOR && isPanelOverflowing(editorPanelRef)) {
				scrollToMakePanelVisible(editorPanelRef)
			}
		}, 100)

		return () => clearTimeout(timer)
	}, [activePane, isPanelOverflowing, scrollToMakePanelVisible])

	// visibleの変化に応じてアニメーション状態を設定
	useEffect(() => {
		if (visible) {
			// 表示開始時：まずvisibility: visibleにしてからアニメーション開始
			setIsVisibilityHidden(false)
			setAnimationState('entering')
			// アニメーション完了後にidleに戻す
			const timer = setTimeout(() => setAnimationState('idle'), 400)
			return () => clearTimeout(timer)
		} else {
			// 非表示開始時：アニメーション開始
			setAnimationState('exiting')
			// アニメーション完了後にvisibility: hiddenにしてidleに戻す
			const timer = setTimeout(() => {
				setIsVisibilityHidden(true)
				setAnimationState('idle')
			}, 50)
			return () => clearTimeout(timer)
		}
	}, [visible])

	const handleThemeEdit = useCallback(() => {
		onThemeEdit?.()
	}, [onThemeEdit])

	const handleFileLoad = useCallback(() => {
		if (!onFileLoad) return

		// ファイル入力要素を再利用または作成
		if (!fileInputRef.current) {
			const fileInput = document.createElement('input')
			fileInput.type = 'file'
			fileInput.accept = '.txt,.md,.json'
			fileInput.style.display = 'none'
			fileInput.setAttribute('aria-label', 'テキストファイルを選択')
			fileInput.setAttribute('aria-describedby', 'file-input-help')
			fileInputRef.current = fileInput
		}

		const fileInput = fileInputRef.current

		// 前回のイベントリスナーをクリア
		fileInput.onchange = null

		// ファイル選択時の処理
		fileInput.onchange = event => {
			const target = event.target as HTMLInputElement
			if (target.files && target.files[0]) {
				const file = target.files[0]
				const reader = new FileReader()
				reader.onload = e => {
					const content = e.target?.result as string
					onFileLoad(content, file.name)
				}
				reader.readAsText(file)
			}
			// 値をリセットして同じファイルを再選択できるようにする
			fileInput.value = ''
		}
		// ファイル選択ダイアログを開く
		fileInput.click()
	}, [onFileLoad])

	// インライン関数を最適化
	const handleEditorFocus = useCallback(() => {
		onToolbarFocusChange(DISPLAY_MODE.EDITOR)
	}, [onToolbarFocusChange])

	const handlePreviewFocus = useCallback(() => {
		onToolbarFocusChange(DISPLAY_MODE.PREVIEW)
	}, [onToolbarFocusChange])

	// ツールバーのクラス名を動的に生成
	const toolbarClassName = useMemo(() => {
		const baseClass = styles.toolbar
		const visibilityClass = visible ? styles.visible : styles.hidden
		const animationClass =
			animationState === 'entering'
				? styles['smooth-enter']
				: animationState === 'exiting'
					? styles['smooth-exit']
					: ''
		const hiddenClass = isVisibilityHidden ? styles.collapsed : ''

		return `${baseClass} ${visibilityClass} ${animationClass} ${hiddenClass}`.trim()
	}, [visible, animationState, isVisibilityHidden])

	// ツールバーアイテムのリストを動的に取得
	const toolbarItems = useMemo(() => {
		const items: HTMLElement[] = []
		if (editorPanelRef.current && activePane !== DISPLAY_MODE.PREVIEW) {
			items.push(editorPanelRef.current)
		}
		if (previewPanelRef.current && activePane !== DISPLAY_MODE.EDITOR) {
			items.push(previewPanelRef.current)
		}
		return items
	}, [activePane, editorPanelRef.current, previewPanelRef.current])

	// スクロール位置を監視する関数
	const checkScrollPosition = useCallback(() => {
		if (toolbarRef.current) {
			const content = toolbarRef.current.querySelector(`.${styles.toolbarContent}`) as HTMLElement
			if (content) {
				const { scrollLeft, scrollWidth, clientWidth } = content
				setCanScrollLeft(scrollLeft > 0)
				setCanScrollRight(scrollLeft < scrollWidth - clientWidth - 1)
			}
		}
	}, [])

	// スクロールイベントリスナーを設定
	useEffect(() => {
		if (toolbarRef.current) {
			const content = toolbarRef.current.querySelector(`.${styles.toolbarContent}`) as HTMLElement
			if (content) {
				content.addEventListener('scroll', checkScrollPosition)
				// 初期状態をチェック
				checkScrollPosition()

				return () => {
					content.removeEventListener('scroll', checkScrollPosition)
				}
			}
		}
	}, [checkScrollPosition])

	// テーマカラー用のインラインスタイル
	const themeStyles = useMemo(
		() => ({
			background: themeColors?.backgroundColor || '#ffffff',
			color: themeColors?.textColor || '#000000',
		}),
		[themeColors?.backgroundColor, themeColors?.textColor]
	)

	return (
		<nav ref={toolbarRef} className={toolbarClassName} style={themeStyles}>
			<div className={styles.hamburgerContainer}>
				<HamburgerMenu
					onThemeEdit={handleThemeEdit}
					onFileLoad={handleFileLoad}
					onExportOpen={onExportOpen}
				/>
			</div>

			{/* 左スクロールボタン */}
			<button
				className={`${styles.scrollButton} ${styles.left} ${!canScrollLeft ? styles.hidden : ''}`}
				onClick={() => {
					// まず、はみ出しているパネルがある場合はそれを優先的に表示
					if (isPanelOverflowing(lastSpacerRef)) {
						scrollToMakePanelVisible(lastSpacerRef)
					} else if (isPanelOverflowing(editorPanelRef)) {
						scrollToMakePanelVisible(editorPanelRef)
					} else {
						// 通常のスクロール
						if (toolbarRef.current) {
							const content = toolbarRef.current.querySelector(`.${styles.toolbarContent}`) as HTMLElement
							if (content) {
								// パネルの幅に応じてスクロール量を調整
								const scrollAmount = Math.max(200, content.clientWidth * 0.8)
								content.scrollBy({ left: -scrollAmount, behavior: 'smooth' })
							}
						}
					}
				}}
				aria-label="左にスクロール"
				disabled={!canScrollLeft}
			>
				‹
			</button>

			<div className={styles.toolbarContent}>
				{/* エディターパネル：PREVIEWモード以外で表示（左寄せ） */}
				{activePane !== DISPLAY_MODE.PREVIEW && (
					<div ref={editorPanelRef} className={`${styles.toolbarItem} ${styles.editorPanel}`}>
						<EditorSettingsPanel
							settings={editorSettings}
							onChange={onEditorSettingChange}
							onToolbarFocusChange={handleEditorFocus}
							text={currentText}
						/>
					</div>
				)}

				{/* 中央のスペーサー：両方のパネルが表示される場合のみ */}
				{activePane === DISPLAY_MODE.BOTH && <div className={styles.spacer}></div>}

				{/* プレビューパネル：EDITORモード以外で表示（右寄せ） */}
				{activePane !== DISPLAY_MODE.EDITOR && (
					<div ref={previewPanelRef} className={`${styles.toolbarItem} ${styles.previewPanel}`}>
						<PreviewSettingsPanel
							settings={previewSettings}
							onChange={onPreviewSettingChange}
							onToolbarFocusChange={handlePreviewFocus}
						/>
					</div>
				)}
				{activePane === DISPLAY_MODE.BOTH && (
					<div ref={previewPanelRef} className={styles.lastSpacer}></div>
				)}
			</div>

			{/* 右スクロールボタン */}
			<button
				className={`${styles.scrollButton} ${styles.right} ${!canScrollRight ? styles.hidden : ''}`}
				onClick={() => {
					// まず、はみ出しているパネルがある場合はそれを優先的に表示

					if (isPanelOverflowing(lastSpacerRef)) {
						scrollToMakePanelVisible(lastSpacerRef)
					} else {
						// 通常のスクロール
						if (toolbarRef.current) {
							const content = toolbarRef.current.querySelector(`.${styles.toolbarContent}`) as HTMLElement
							if (content) {
								// パネルの幅に応じてスクロール量を調整
								const scrollAmount = Math.max(200, content.clientWidth * 0.8)
								content.scrollBy({ left: scrollAmount, behavior: 'smooth' })
							}
						}
					}
				}}
				aria-label="右にスクロール"
				disabled={!canScrollRight}
			>
				›
			</button>
		</nav>
	)
}
