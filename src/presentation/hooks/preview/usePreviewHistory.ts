import { useState, useCallback } from 'react'
import { TextSnapshot } from '@/domain'

interface UsePreviewHistoryProps {
	textHistory: TextSnapshot[]
	onRestoreHistory?: (snapshot: TextSnapshot) => void
}

export const usePreviewHistory = ({ textHistory, onRestoreHistory }: UsePreviewHistoryProps) => {
	const [selectedSnapshotId, setSelectedSnapshotId] = useState<string | undefined>()
	const [showHistoryDetailDialog, setShowHistoryDetailDialog] = useState(false)

	const handleSnapshotSelect = useCallback((snapshot: TextSnapshot) => {
		setSelectedSnapshotId(snapshot.id)
		setShowHistoryDetailDialog(true)
	}, [])

	const handleCloseHistoryDialog = useCallback(() => {
		setShowHistoryDetailDialog(false)
	}, [])

	return {
		selectedSnapshotId,
		showHistoryDetailDialog,
		handleSnapshotSelect,
		handleCloseHistoryDialog,
		onRestoreHistory,
	}
}
