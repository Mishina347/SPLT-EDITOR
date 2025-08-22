import React from 'react'
import { RightPane } from '../preview/RightPane'
import { LayoutContainer } from './LayoutContainer'
import { EditorSettings, LayoutConfig, TextSnapshot } from '../../../domain'
import { EditorComponent } from '..'
interface CommonProps {
	// エディター関連
	editorSettings: EditorSettings
	currentNotSavedText: string
	onChangeText: (text: string) => void
	onFocusEditor: () => void
	onMaximizeEditor: () => void

	// プレビュー関連
	currentSavedText: string
	lastSavedText: string
	previewSettings: LayoutConfig
	textHistory: TextSnapshot[]
	onFocusPreview: () => void
	onMaximizePreview: () => void
	onRestoreHistory: (snapshot: TextSnapshot) => void

	// レイアウト関連
	layoutType: 'fixed' | 'draggable-dual' | 'draggable-editor' | 'draggable-preview'
	currentEditorSize: number
	isDragging: boolean

	// ページ情報関連
	onPageInfoChange?: (currentPage: number, totalPages: number) => void

	// 最大化状態管理
	editorMaximized?: boolean
	previewMaximized?: boolean
}

interface FixedLayoutProps extends CommonProps {
	layoutType: 'fixed'
	showEditor?: boolean
	showPreview: boolean
	containerRef: React.RefObject<HTMLDivElement>
	resizerElement: React.ReactNode
}

interface DraggableLayoutProps extends CommonProps {
	layoutType: 'draggable-dual' | 'draggable-editor' | 'draggable-preview'
	editorContainerConfig?: any
	previewContainerConfig?: any
	containerClassName?: string
}

type LayoutRendererProps = FixedLayoutProps | DraggableLayoutProps

export const LayoutRenderer: React.FC<LayoutRendererProps> = props => {
	const {
		layoutType,
		editorSettings,
		currentNotSavedText,
		onChangeText,
		onFocusEditor,
		onMaximizeEditor,
		currentSavedText,
		lastSavedText,
		previewSettings,
		textHistory,
		onFocusPreview,
		onMaximizePreview,
		onRestoreHistory,
		currentEditorSize,
		isDragging,
		onPageInfoChange,
		editorMaximized = false,
		previewMaximized = false,
	} = props

	// エディターコンポーネントの共通props
	const editorProps = {
		textData: currentNotSavedText,
		settings: editorSettings,
		onChange: onChangeText,
		onMaximize: onMaximizeEditor,
		onFocusPane: onFocusEditor,
		isDragging: layoutType === 'fixed' ? isDragging : false,
		isMaximized: editorMaximized,
	}

	// プレビューコンポーネントの共通props
	const previewProps = {
		currentSavedText,
		currentNotSavedText,
		lastSavedText,
		previewSetting: previewSettings,
		textHistory,
		onMaximize: onMaximizePreview,
		onFocusPane: onFocusPreview,
		onRestoreHistory,
		onPageInfoChange,
	}

	// 固定レイアウトの場合
	if (layoutType === 'fixed') {
		const { showEditor = true, showPreview, containerRef, resizerElement } = props as FixedLayoutProps

		return (
			<section style={{ display: 'flex', flex: 1, overflow: 'hidden' }} ref={containerRef}>
				{showEditor && (
					<LayoutContainer
						layoutType="fixed"
						style={{
							width: showPreview ? `${currentEditorSize}%` : '100%',
							flexShrink: 0,
						}}
					>
						<EditorComponent {...editorProps} extended={!showPreview} isMaximized={editorMaximized} />
					</LayoutContainer>
				)}

				{showEditor && showPreview && resizerElement}

				{showPreview && (
					<LayoutContainer
						layoutType="fixed"
						style={{
							width: showEditor ? `${100 - currentEditorSize}%` : '100%',
							flexShrink: 0,
						}}
					>
						<RightPane {...previewProps} isMaximized={previewMaximized} />
					</LayoutContainer>
				)}
			</section>
		)
	}

	// ドラッグ可能レイアウトの場合
	const { editorContainerConfig, previewContainerConfig, containerClassName } =
		props as DraggableLayoutProps

	return (
		<section
			className={containerClassName}
			style={{
				position: 'absolute',
				top: 0,
				left: 0,
				right: 0,
				bottom: 0,
				width: '100%',
				height: '100%',
				overflow: 'hidden',
			}}
		>
			{/* エディターコンテナ */}
			{(layoutType === 'draggable-dual' || layoutType === 'draggable-editor') &&
				editorContainerConfig && (
					<LayoutContainer layoutType={layoutType} containerConfig={editorContainerConfig}>
						<EditorComponent
							{...editorProps}
							extended={layoutType === 'draggable-editor'}
							isMaximized={editorContainerConfig.isMaximized}
						/>
					</LayoutContainer>
				)}

			{/* プレビューコンテナ */}
			{(layoutType === 'draggable-dual' || layoutType === 'draggable-preview') &&
				previewContainerConfig && (
					<LayoutContainer layoutType={layoutType} containerConfig={previewContainerConfig}>
						<RightPane
							{...previewProps}
							isMaximized={previewContainerConfig.isMaximized}
							isDraggableMode={true}
						/>
					</LayoutContainer>
				)}
		</section>
	)
}
