import { useEffect, useRef, useCallback } from 'react'
import * as monaco from 'monaco-editor'
import {
	MonacoEditorService,
	MonacoEditorConfig,
} from '../../application/editor/MonacoEditorService'
import { FontFamily } from '../../domain'

interface UseMonacoEditorProps {
	fontSize: number
	wordWrapColumn: number
	fontFamily: FontFamily
	backgroundColor: string
	textColor: string
	value: string
	onChange: (value: string) => void
	onFocus?: () => void
}

export const useMonacoEditor = ({
	fontSize,
	wordWrapColumn,
	fontFamily,
	backgroundColor,
	textColor,
	value,
	onChange,
	onFocus,
}: UseMonacoEditorProps) => {
	const containerRef = useRef<HTMLDivElement>(null)
	const editorRef = useRef<monaco.editor.IStandaloneCodeEditor | null>(null)
	const monacoService = useRef(MonacoEditorService.getInstance())

	// エディタの初期化と設定更新
	useEffect(() => {
		if (!containerRef.current) return

		const config: MonacoEditorConfig = {
			fontSize,
			wordWrapColumn,
			fontFamily,
			theme: { backgroundColor, textColor },
		}

		// 既存のエディタがあれば破棄
		if (editorRef.current) {
			editorRef.current.dispose()
			editorRef.current = null
		}

		// 新しいエディタを作成
		const editor = monacoService.current.createEditor(containerRef.current, config, value)

		editorRef.current = editor

		// 変更イベントのリスナーを設定
		const disposable = editor.onDidChangeModelContent(() => {
			const currentValue = editor.getValue()
			onChange(currentValue)
		})

		// フォーカスイベントのリスナーを設定
		let focusDisposable: monaco.IDisposable | undefined
		if (onFocus) {
			focusDisposable = editor.onDidFocusEditorText(() => {
				onFocus()
			})
		}

		// クリーンアップ
		return () => {
			disposable.dispose()
			focusDisposable?.dispose()
			editor.dispose()
		}
	}, [fontSize, wordWrapColumn, fontFamily, backgroundColor, textColor])

	// 値の同期（外部からの変更を反映）
	useEffect(() => {
		if (editorRef.current && editorRef.current.getValue() !== value) {
			const position = editorRef.current.getPosition()
			editorRef.current.setValue(value)
			if (position) {
				editorRef.current.setPosition(position)
			}
		}
	}, [value])

	// エディタのレイアウト再計算
	const layout = useCallback(() => {
		if (editorRef.current) {
			setTimeout(() => {
				editorRef.current?.layout()
			}, 50)
		}
	}, [])

	// エディタのフォーカス
	const focus = useCallback(() => {
		if (editorRef.current) {
			editorRef.current.focus()
		}
	}, [])

	// エディタの値を取得
	const getValue = useCallback(() => {
		return editorRef.current?.getValue() || ''
	}, [])

	// カーソル位置を取得
	const getPosition = useCallback(() => {
		return editorRef.current?.getPosition() || null
	}, [])

	// カーソル位置を設定
	const setPosition = useCallback((position: monaco.Position) => {
		if (editorRef.current) {
			editorRef.current.setPosition(position)
		}
	}, [])

	// 選択範囲を取得
	const getSelection = useCallback(() => {
		return editorRef.current?.getSelection() || null
	}, [])

	// 選択範囲を設定
	const setSelection = useCallback((selection: monaco.Selection) => {
		if (editorRef.current) {
			editorRef.current.setSelection(selection)
		}
	}, [])

	// クリーンアップ
	useEffect(() => {
		return () => {
			if (editorRef.current) {
				editorRef.current.dispose()
			}
		}
	}, [])

	return {
		containerRef,
		editorRef,
		layout,
		focus,
		getValue,
		getPosition,
		setPosition,
		getSelection,
		setSelection,
	}
}
