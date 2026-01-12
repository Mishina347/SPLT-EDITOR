import React from 'react'
import { DictionarySearchResult } from '@/infra/dictionary/JishoDictionaryService'
import styles from './DictionaryViewer.module.css'

interface DictionaryViewerProps {
	searchResult: DictionarySearchResult | null
	isLoading: boolean
	error: string | null
	selectedText: string | undefined
}

export const DictionaryViewer: React.FC<DictionaryViewerProps> = ({
	searchResult,
	isLoading,
	error,
	selectedText,
}) => {
	if (!selectedText || selectedText.trim().length === 0) {
		return (
			<div className={styles.dictionaryContainer}>
				<div className={styles.emptyState}>
					<p>テキストを選択すると、辞書検索結果が表示されます</p>
				</div>
			</div>
		)
	}

	if (isLoading) {
		return (
			<div className={styles.dictionaryContainer}>
				<div className={styles.loadingState}>
					<p>検索中...</p>
				</div>
			</div>
		)
	}

	if (error) {
		return (
			<div className={styles.dictionaryContainer}>
				<div className={styles.errorState}>
					<p>エラー: {error}</p>
				</div>
			</div>
		)
	}

	if (!searchResult || searchResult.entries.length === 0) {
		return (
			<div className={styles.dictionaryContainer}>
				<div className={styles.emptyState}>
					<p>「{selectedText}」の検索結果が見つかりませんでした</p>
					<p className={styles.debugInfo}>検索クエリ: 「{searchResult?.query || selectedText}」</p>
					<p className={styles.hint}>
						ヒント:
						単語や熟語を選択すると検索できます。長い文章の場合は、検索したい単語だけを選択してください。
					</p>
				</div>
			</div>
		)
	}

	return (
		<div className={styles.dictionaryContainer}>
			<div className={styles.header}>
				<h3 className={styles.title}>検索結果: 「{searchResult.query}」</h3>
			</div>
			<div className={styles.entries}>
				{searchResult.entries.map((entry, index) => (
					<div key={index} className={styles.entry}>
						<div className={styles.entryHeader}>
							<span className={styles.word}>{entry.word}</span>
							{entry.reading && entry.reading !== entry.word && (
								<span className={styles.reading}>{entry.reading}</span>
							)}
							{entry.common && <span className={styles.commonTag}>常用</span>}
						</div>
						{entry.senses.length > 0 && (
							<div className={styles.senses}>
								{entry.senses.map((sense, senseIndex) => (
									<div key={senseIndex} className={styles.sense}>
										{sense}
									</div>
								))}
							</div>
						)}
						{entry.partsOfSpeech && entry.partsOfSpeech.length > 0 && (
							<div className={styles.partsOfSpeech}>
								{entry.partsOfSpeech.map((pos, posIndex) => (
									<span key={posIndex} className={styles.posTag}>
										{pos}
									</span>
								))}
							</div>
						)}
						{entry.tags.length > 0 && (
							<div className={styles.tags}>
								{entry.tags.map((tag, tagIndex) => (
									<span key={tagIndex} className={styles.tag}>
										{tag}
									</span>
								))}
							</div>
						)}
					</div>
				))}
			</div>
		</div>
	)
}
