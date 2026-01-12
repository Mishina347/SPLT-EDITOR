import React, { useMemo } from 'react'
import styles from './DictionaryViewer.module.css'

interface DictionaryViewerProps {
	selectedText: string | undefined
}

export const DictionaryViewer: React.FC<DictionaryViewerProps> = ({ selectedText }) => {
	// Weblio検索URLを生成
	const weblioUrl = useMemo(() => {
		if (!selectedText || selectedText.trim().length === 0) {
			return null
		}
		const query = encodeURIComponent(selectedText.trim())
		return `https://www.weblio.jp/content/${query}`
	}, [selectedText])

	if (!selectedText || selectedText.trim().length === 0) {
		return (
			<div className={styles.dictionaryContainer}>
				<div className={styles.emptyState}>
					<p>テキストを選択すると、辞書検索結果が表示されます</p>
				</div>
			</div>
		)
	}

	// Weblio検索をiframeで表示
	return (
		<div className={styles.dictionaryContainer}>
			<div className={styles.header}>
				<h3 className={styles.title}>Weblio辞書: 「{selectedText}」</h3>
			</div>
			<div className={styles.iframeContainer}>
				{weblioUrl && (
					<iframe
						src={weblioUrl}
						className={styles.weblioIframe}
						title={`Weblio辞書検索: ${selectedText}`}
						sandbox="allow-same-origin allow-scripts allow-popups allow-forms"
						loading="lazy"
					/>
				)}
			</div>
		</div>
	)
}
