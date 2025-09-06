import React, { useMemo } from 'react'
import * as monaco from 'monaco-editor'
import styles from './Counter.module.css'
import { wordCounter, formatNumber } from '@/utils'
import { useDebounce, useSelectionCharCount } from '@/presentation/hooks'

type CounterProps = {
	text: string
	editorRef?: React.MutableRefObject<monaco.editor.IStandaloneCodeEditor | null>
}

export const Counter: React.FC<CounterProps> = ({ text, editorRef }) => {
	// デバウンスでパフォーマンス最適化
	const debouncedText = useDebounce(text, 300)

	// 選択範囲の文字数取得
	const selectionCounts = useSelectionCharCount(editorRef || { current: null })

	// 文字数、行数、原稿用紙枚数を計算（デバウンス済みテキストで）
	const { characterCount, lineCount, pageCount } = useMemo(() => {
		return wordCounter(debouncedText)
	}, [debouncedText])

	// リアルタイム表示用の簡易カウント（長さのみ）
	const immediateCharCount = useMemo(() => {
		return text.replace(/\n/g, '').length
	}, [text])

	// 選択範囲があるかどうか
	const hasSelection = selectionCounts.selectedText.length > 0

	return (
		<div className={styles.fieldGroup}>
			<section className={styles.counterDisplay} role="status" aria-label="文書統計">
				{hasSelection ? (
					<>
						<output
							className={styles.selectionCount}
							aria-label={`選択範囲: ${selectionCounts.characterCount}文字`}
						>
							<span className={styles.selectionLabel}>選択:</span>
							{formatNumber(selectionCounts.characterCount)} 文字
						</output>
						<output className={styles.totalCount} aria-label={`全体: ${characterCount}文字`}>
							<span className={styles.totalLabel}>全体:</span>
							{text === debouncedText
								? formatNumber(characterCount)
								: formatNumber(immediateCharCount)}{' '}
							文字
							{text !== debouncedText && <span style={{ opacity: 0.6 }}>...</span>}
						</output>
					</>
				) : (
					<output className={styles.characterCount} aria-label={`${characterCount}文字`}>
						{/* 計算中は即座に更新、完了したら正確な値を表示 */}
						{text === debouncedText
							? formatNumber(characterCount)
							: formatNumber(immediateCharCount)}{' '}
						文字
						{text !== debouncedText && <span style={{ opacity: 0.6 }}>...</span>}
					</output>
				)}
				<output className={styles.lineCount} aria-label={`${lineCount}行`}>
					（1行20文字換算）{formatNumber(lineCount)} 行
				</output>
				<output className={styles.wordCount} aria-label={`${pageCount}枚`}>
					(20×20換算) {formatNumber(pageCount)} 枚
				</output>
			</section>
		</div>
	)
}
