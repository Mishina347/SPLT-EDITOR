import React, { useMemo } from 'react'
import { TextSnapshot } from '../../../../domain/entities/TextHistory'
import styles from './TextHistoryTimeline.module.css'
import { formatTimestamp } from '../../../../utils'

interface TextHistoryTimelineProps {
	snapshots: TextSnapshot[]
	selectedSnapshotId?: string
	onSnapshotSelect: (snapshot: TextSnapshot) => void
}

export const TextHistoryTimeline: React.FC<TextHistoryTimelineProps> = ({
	snapshots,
	selectedSnapshotId,
	onSnapshotSelect,
}) => {
	const formatDescription = useMemo(
		() =>
			(snapshot: TextSnapshot): string => {
				if (snapshot.description) {
					return snapshot.description
				}
				return `保存 (${snapshot.content.length}文字)`
			},
		[]
	)

	return (
		<div className={styles.timelineContainer}>
			<h3 className={styles.timelineTitle}>変更履歴</h3>
			<div className={styles.timelineList}>
				{snapshots.length === 0 ? (
					<div className={styles.emptyState}>履歴がありません</div>
				) : (
					snapshots.map((snapshot, index) => (
						<button
							key={snapshot.id}
							//最新は差分がないのでクリックさせても意味がないので無効化
							disabled={index === 0}
							className={`${styles.timelineItem} ${
								selectedSnapshotId === snapshot.id ? styles.selected : ''
							}`}
							onClick={() => onSnapshotSelect(snapshot)}
						>
							<div className={styles.timelineDot} />
							<div className={styles.timelineContent}>
								<div className={styles.timelineTime}>{formatTimestamp(snapshot.timestamp)}</div>
								<div className={styles.timelineDescription}>{formatDescription(snapshot)}</div>
							</div>
							{index === 0 && <span className={styles.latestBadge}>最新</span>}
						</button>
					))
				)}
			</div>
		</div>
	)
}
