import React, { useState, useCallback, useMemo, useRef, useEffect } from 'react'
import { EditorSettingsPanel } from './editorCongig/EditorSettingsPanel'
import { PreviewSettingsPanel } from './previewConfig/PreviewSettingsPanel'

import { HamburgerMenu } from './HamburgerMenu'
import { OverflowMenu } from './OverflowMenu'
import { useToolbarOverflow } from '../../hooks/useToolbarOverflow'
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
	currentSavedText,
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

	// オーバーフロー管理
	const { hiddenItems, hasOverflow, recheck } = useToolbarOverflow({
		container: toolbarRef.current,
		items: toolbarItems,
		threshold: 120, // オーバーフローボタンとマージンのためのスペース
	})

	// アイテム変更時にオーバーフローを再計算
	useEffect(() => {
		recheck()
	}, [activePane, recheck])

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
			<div className={styles.toolbarContent}>
				{activePane !== DISPLAY_MODE.PREVIEW && (
					<div ref={editorPanelRef} className={styles.toolbarItem}>
						<EditorSettingsPanel
							settings={editorSettings}
							onChange={onEditorSettingChange}
							onToolbarFocusChange={handleEditorFocus}
							text={currentText}
						/>
					</div>
				)}
				{activePane !== DISPLAY_MODE.EDITOR && (
					<div ref={previewPanelRef} className={styles.toolbarItem}>
						<PreviewSettingsPanel
							settings={previewSettings}
							onChange={onPreviewSettingChange}
							onToolbarFocusChange={handlePreviewFocus}
						/>
					</div>
				)}
			</div>
			<OverflowMenu
				items={hiddenItems.map(item => ({ id: item.id, element: item.element }))}
				visible={hasOverflow}
			/>
		</nav>
	)
}
