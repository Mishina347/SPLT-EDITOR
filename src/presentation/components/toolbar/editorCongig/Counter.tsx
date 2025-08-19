import React, { useMemo } from 'react'
import styles from './Counter.module.css'
import { wordCounter } from '../../../../utils'
import { useDebounce } from '../../../hooks/useDebounce'

type CounterProps = {
	text: string
}

export const Counter: React.FC<CounterProps> = ({ text }) => {
	// デバウンスでパフォーマンス最適化
	const debouncedText = useDebounce(text, 300)

	// 文字数、行数、原稿用紙枚数を計算（デバウンス済みテキストで）
	const { characterCount, lineCount, pageCount } = useMemo(() => {
		return wordCounter(debouncedText)
	}, [debouncedText])

	// リアルタイム表示用の簡易カウント（長さのみ）
	const immediateCharCount = useMemo(() => {
		return text.replace(/\n/g, '').length
	}, [text])

	return (
		<div className={styles.fieldGroup}>
			<label className={styles.label}>現在の文章</label>
			<div className={styles.counterDisplay} role="status" aria-label="文書統計">
				<span className={styles.characterCount} aria-label={`${characterCount}文字`}>
					{/* 計算中は即座に更新、完了したら正確な値を表示 */}
					{text === debouncedText ? characterCount : immediateCharCount} 文字
					{text !== debouncedText && <span style={{ opacity: 0.6 }}>...</span>}
				</span>
				<span className={styles.lineCount} aria-label={`${lineCount}行`}>
					（1行20文字換算）{lineCount} 行
				</span>
				<span className={styles.wordCount} aria-label={`${pageCount}枚`}>
					(20×20換算) {pageCount} 枚
				</span>
			</div>
		</div>
	)
}
