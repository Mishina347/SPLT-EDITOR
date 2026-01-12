import { useCallback, useEffect, useMemo, useState, useRef } from 'react'
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
	// エディタインスタンスの変更を検知するための状態
	const [editorInstance, setEditorInstance] = useState<monaco.editor.IStandaloneCodeEditor | null>(
		null
	)
	// 前のエディタインスタンスを追跡するためのref（無限ループを防ぐ）
	const prevEditorInstanceRef = useRef<monaco.editor.IStandaloneCodeEditor | null>(null)

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

	// エディタインスタンスの変更を定期的にチェック（再作成を検知）
	useEffect(() => {
		const checkEditorChange = () => {
			const currentEditor = editorRef.current

			// エディタインスタンスが変更された場合、状態を更新してuseEffectをトリガー
			if (currentEditor !== prevEditorInstanceRef.current) {
				logger.debug('useSelectionCharCount', 'Editor instance changed, updating state')
				prevEditorInstanceRef.current = currentEditor
				setEditorInstance(currentEditor)
			}
		}

		// 初回チェック
		checkEditorChange()

		// 定期的にチェック（エディタの再作成を検知）
		const interval = setInterval(checkEditorChange, 50)

		return () => clearInterval(interval)
	}, [editorRef])

	// エディタインスタンスの変更を監視してイベントリスナーを再設定
	useEffect(() => {
		const currentEditor = editorInstance

		// エディタが存在しない場合
		if (!currentEditor) {
			setSelectedText('')
			return
		}

		const update = () => {
			const newSelectedText = computeSelectedText()
			logger.debug('useSelectionCharCount', `Updating selected text: "${newSelectedText}"`)
			setSelectedText(newSelectedText)
		}

		logger.debug('useSelectionCharCount', 'Setting up event listeners for editor instance')
		const d1 = currentEditor.onDidChangeCursorSelection(update)
		const d2 = currentEditor.onDidChangeModelContent(update)

		// 初期化（少し遅延させてエディタの準備を待つ）
		const initTimeout = setTimeout(() => {
			update()
		}, 100)

		return () => {
			clearTimeout(initTimeout)
			logger.debug('useSelectionCharCount', 'Cleaning up event listeners')
			d1.dispose()
			d2.dispose()
		}
	}, [editorInstance, computeSelectedText])

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
