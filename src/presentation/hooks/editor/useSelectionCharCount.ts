import { useCallback, useEffect, useMemo, useState } from 'react'
import * as monaco from 'monaco-editor'
import { wordCounter } from '@/utils/wordCounter'
import { logger } from '@/utils/logger'

export type SelectionCharCount = {
	selectedText: string
	characterCount: number
	lineCount: number
	pageCount: number
}

export const useSelectionCharCount = (
	editorRef: React.MutableRefObject<monaco.editor.IStandaloneCodeEditor | null>
) => {
	const [selectedText, setSelectedText] = useState<string>('')
	const [isEditorReady, setIsEditorReady] = useState(false)

	const computeSelectedText = useCallback(() => {
		const editor = editorRef.current
		if (!editor) {
			logger.debug('useSelectionCharCount', 'Editor not available')
			return ''
		}
		const selection = editor.getSelection()
		const model = editor.getModel()
		if (!selection || !model) {
			logger.debug('useSelectionCharCount', 'Selection or model not available')
			return ''
		}
		const selectedText = model.getValueInRange(selection)
		logger.debug(
			'useSelectionCharCount',
			`Selected text: "${selectedText}" (length: ${selectedText.length})`
		)
		return selectedText
	}, [editorRef])

	// エディタの準備状態を監視
	useEffect(() => {
		const checkEditorReady = () => {
			if (editorRef.current) {
				logger.debug('useSelectionCharCount', 'Editor is ready')
				setIsEditorReady(true)
				return true
			} else {
				logger.debug('useSelectionCharCount', 'Editor not ready yet')
				setIsEditorReady(false)
				return false
			}
		}

		// 初回チェック
		if (checkEditorReady()) {
			return // エディタが既に準備完了している場合
		}

		// 定期的にチェック（エディタの初期化を待つ）
		const interval = setInterval(() => {
			if (checkEditorReady()) {
				clearInterval(interval)
			}
		}, 50) // より頻繁にチェック

		return () => clearInterval(interval)
	}, [editorRef])

	// Subscribe to selection/content changes
	useEffect(() => {
		if (!isEditorReady) {
			logger.debug('useSelectionCharCount', 'Editor not ready, skipping event listener setup')
			return
		}

		const editor = editorRef.current
		if (!editor) {
			logger.debug('useSelectionCharCount', 'Editor not available in useEffect')
			return
		}

		const update = () => {
			const newSelectedText = computeSelectedText()
			logger.debug('useSelectionCharCount', `Updating selected text: "${newSelectedText}"`)
			setSelectedText(newSelectedText)
		}

		logger.debug('useSelectionCharCount', 'Setting up event listeners')
		const d1 = editor.onDidChangeCursorSelection(update)
		const d2 = editor.onDidChangeModelContent(update)

		// 初期化
		update()

		return () => {
			logger.debug('useSelectionCharCount', 'Cleaning up event listeners')
			d1.dispose()
			d2.dispose()
		}
	}, [editorRef, computeSelectedText, isEditorReady])

	const counts: SelectionCharCount = useMemo(() => {
		const { characterCount, lineCount, pageCount } = wordCounter(selectedText)
		logger.debug(
			'useSelectionCharCount',
			`Computed counts: ${characterCount} chars, ${lineCount} lines, ${pageCount} pages`
		)
		return { selectedText, characterCount, lineCount, pageCount }
	}, [selectedText])

	return counts
}
