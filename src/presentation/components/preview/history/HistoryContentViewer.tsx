import React, { useState } from 'react'
import { TextSnapshot } from '../../../../domain/entities/TextHistory'
import styles from './HistoryContentViewer.module.css'
import buttonStyles from '../../../shared/Button/Button.module.css'
import { formatNumber } from '@/utils'

interface HistoryContentViewerProps {
	snapshot: TextSnapshot
	onRestore: (snapshot: TextSnapshot) => void
}

export const HistoryContentViewer: React.FC<HistoryContentViewerProps> = ({
	snapshot,
	onRestore,
}) => {
	const [showRestoreMessage, setShowRestoreMessage] = useState(false)

	const formatTimestamp = (date: Date): string => {
		return date.toLocaleString('ja-JP', {
			year: 'numeric',
			month: '2-digit',
			day: '2-digit',
			hour: '2-digit',
			minute: '2-digit',
			second: '2-digit',
		})
	}

	const handleRestore = () => {
		if (confirm('この履歴の内容に復元しますか？現在の内容は失われます。')) {
			onRestore(snapshot)
			// 復元完了メッセージを表示
			setShowRestoreMessage(true)
			setTimeout(() => setShowRestoreMessage(false), 3000) // 3秒後に非表示
		}
	}

	return (
		<div className={styles.contentViewerContainer}>
			{showRestoreMessage && <div className={styles.restoreMessage}>✓ 履歴の内容を復元しました</div>}
			<div className={styles.contentHeader}>
				<div className={styles.snapshotInfo}>
					<h3 className={styles.snapshotTitle}>履歴の内容</h3>
					<div className={styles.snapshotMeta}>
						<span className={styles.timestamp}>{formatTimestamp(snapshot.timestamp)}</span>
						<span className={styles.description}>{snapshot.description}</span>
						<span className={styles.charCount}>{formatNumber(snapshot.content.length)}文字</span>
					</div>
				</div>
				<button
					className={`${buttonStyles.button} ${buttonStyles.buttonPrimary}`}
					onClick={handleRestore}
					title="この履歴の内容に復元"
				>
					復元
				</button>
			</div>
			<div className={styles.contentBody}>
				<div className={styles.contentText}>{snapshot.content || '内容がありません'}</div>
			</div>
		</div>
	)
}
