import React, { useState, useEffect } from 'react'
import { Dialog, TabPanel, TabItem } from '../../'
import { HistoryContentViewer } from './HistoryContentViewer'
import { HistoryDiffViewer } from './HistoryDiffViewer'
import { TextSnapshot } from '../../../../domain'
import styles from './HistoryDetailDialog.module.css'

interface HistoryDetailDialogProps {
	isOpen: boolean
	onClose: () => void
	selectedSnapshotId: string | undefined
	textHistory: TextSnapshot[]
	onRestore?: (snapshot: TextSnapshot) => void
}

export const HistoryDetailDialog: React.FC<HistoryDetailDialogProps> = ({
	isOpen,
	onClose,
	selectedSnapshotId,
	textHistory,
	onRestore,
}) => {
	const [viewMode, setViewMode] = useState<'content' | 'diff'>('content')

	// ダイアログが開いているときにbodyのスクロールを無効化
	useEffect(() => {
		if (isOpen) {
			document.body.style.overflow = 'hidden'
		} else {
			document.body.style.overflow = 'auto'
		}

		return () => {
			document.body.style.overflow = 'auto'
		}
	}, [isOpen])

	// 選択されたスナップショットを取得
	const selectedSnapshot = selectedSnapshotId
		? textHistory.find(s => s.id === selectedSnapshotId)
		: undefined

	// 比較用のスナップショット（最新）を取得
	const latestSnapshot = textHistory[0]

	// タブ設定
	const tabs: TabItem[] = [
		{
			id: 'content',
			label: '内容表示',
			ariaLabel: '履歴の内容を表示',
		},
		{
			id: 'diff',
			label: '差分表示',
			ariaLabel: '最新版との差分を表示',
			disabled: textHistory.length <= 1 || !selectedSnapshot,
		},
	]

	const handleTabChange = (tabId: string) => {
		setViewMode(tabId as 'content' | 'diff')
	}

	const handleClose = () => {
		// ダイアログを閉じる時にモードをリセット
		setViewMode('content')
		onClose()
	}

	// 履歴詳細ダイアログ専用のタブスタイル
	const customTabStyles = {
		tabList: {
			background: '#fff',
		},
		tab: {
			color: '#000',
			background: '#fff',
		},
		activeTab: {
			color: '#000',
			background: '#fff',
			fontWeight: 600,
		},
		tabPanel: {
			background: '#fff',
		},
		activeTabBorderColor: '#000',
	}

	return (
		<Dialog
			isOpen={isOpen}
			onClose={handleClose}
			title="履歴詳細"
			constrainToContainer={true}
			maxWidth="800px"
			maxHeight="600px"
		>
			<div className={styles.historyDetailContainer}>
				{selectedSnapshot ? (
					<TabPanel
						tabs={tabs}
						activeTabId={viewMode}
						onTabChange={handleTabChange}
						className={styles.tabContainer}
						customTabStyles={customTabStyles}
					>
						{viewMode === 'content' && (
							<HistoryContentViewer snapshot={selectedSnapshot} onRestore={onRestore || (() => {})} />
						)}

						{viewMode === 'diff' && latestSnapshot && (
							<HistoryDiffViewer oldSnapshot={selectedSnapshot} newSnapshot={latestSnapshot} />
						)}
					</TabPanel>
				) : (
					<div className={styles.noSelection}>
						<p>表示する履歴が選択されていません。</p>
					</div>
				)}
			</div>
		</Dialog>
	)
}
