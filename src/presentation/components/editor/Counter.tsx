import React, { useMemo } from 'react'
import styles from './Counter.module.css'
import { wordCounter } from '../../../utils'

type CounterProps = {
	text: string
}

export const Counter: React.FC<CounterProps> = ({ text }) => {
	// 文字数、行数、単語数を計算
	const { characterCount, lineCount, wordCount } = useMemo(() => {
		return wordCounter(text)
	}, [text])

	return (
		<div className={styles.fieldGroup}>
			<label className={styles.label}>文書統計</label>
			<div className={styles.counterDisplay} role="status" aria-label="文書統計">
				<span className={styles.characterCount} aria-label={`${characterCount}文字`}>
					{characterCount} 文字
				</span>
				<span className={styles.lineCount} aria-label={`${lineCount}行`}>
					{lineCount} 行
				</span>
				<span className={styles.wordCount} aria-label={`${wordCount}単語`}>
					{wordCount} 単語
				</span>
			</div>
		</div>
	)
}
