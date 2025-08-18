import React, { useEffect, useRef, useState, useMemo } from 'react'
import { html as diff2html, parse as diffParse } from 'diff2html'
import 'diff2html/bundles/css/diff2html.min.css'
import { TextSnapshot } from '../../../../domain'
import { Diff2HtmlAdapter } from '../../../../infra'
import styles from './HistoryDiffViewer.module.css'

interface HistoryDiffViewerProps {
	oldSnapshot: TextSnapshot
	newSnapshot: TextSnapshot
}

export const HistoryDiffViewer: React.FC<HistoryDiffViewerProps> = ({
	oldSnapshot,
	newSnapshot,
}) => {
	const diffService = useMemo(() => new Diff2HtmlAdapter(), [])
	const [diffHtml, setDiffHtml] = useState('')
	const diffContainerRef = useRef<HTMLDivElement>(null)

	// 差分計算
	useEffect(() => {
		const unifiedDiff = diffService.generateUnifiedDiff(
			'previous',
			'current',
			oldSnapshot.content,
			newSnapshot.content
		)
		const diffJson = diffParse(unifiedDiff)
		const diffHtmlResult = diff2html(diffJson, {
			drawFileList: false,
			matching: 'lines',
			outputFormat: 'side-by-side',
		})
		setDiffHtml(diffHtmlResult)
	}, [diffService, oldSnapshot.content, newSnapshot.content])

	// 差分表示のHTMLが生成された後にposition: absoluteを修正
	useEffect(() => {
		if (diffContainerRef.current) {
			// 少し遅延を入れてDOMの更新を待つ
			setTimeout(() => {
				const lineNumbers = diffContainerRef.current?.querySelectorAll('.d2h-code-side-linenumber')
				if (lineNumbers) {
					lineNumbers.forEach(lineNumber => {
						if (lineNumber instanceof HTMLElement) {
							lineNumber.style.position = 'relative'
							lineNumber.style.left = 'auto'
							lineNumber.style.top = 'auto'
							lineNumber.style.right = 'auto'
							lineNumber.style.bottom = 'auto'
						}
					})
				}
			}, 100)
		}
	}, [diffHtml])

	const formatTimestamp = (date: Date): string => {
		return date.toLocaleString('ja-JP', {
			year: 'numeric',
			month: '2-digit',
			day: '2-digit',
			hour: '2-digit',
			minute: '2-digit',
		})
	}

	return (
		<div className={styles.diffViewerContainer}>
			<div className={styles.diffHeader}>
				<div className={styles.diffInfo}>
					<div className={styles.snapshotInfo}>
						<span className={styles.label}>比較対象:</span>
						<span className={styles.oldSnapshot}>
							{formatTimestamp(oldSnapshot.timestamp)} ({oldSnapshot.content.length}文字)
						</span>
						<span className={styles.arrow}>→</span>
						<span className={styles.newSnapshot}>
							{formatTimestamp(newSnapshot.timestamp)} ({newSnapshot.content.length}文字)
						</span>
					</div>
				</div>
			</div>
			<div className={styles.diffContent}>
				<div
					ref={diffContainerRef}
					className="diff-container"
					dangerouslySetInnerHTML={{ __html: diffHtml }}
				/>
			</div>
		</div>
	)
}
