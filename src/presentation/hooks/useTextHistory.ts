import { useState, useCallback, useMemo } from 'react'
import {
	TextHistory,
	TextSnapshot,
	createTextHistory,
	addSnapshot,
	getSnapshotById,
} from '../../domain/entities/TextHistory'

export function useTextHistory(maxSnapshots: number = 10) {
	const [history, setHistory] = useState<TextHistory>(() => createTextHistory(maxSnapshots))

	const saveSnapshot = useCallback((content: string, description?: string) => {
		setHistory(prev => addSnapshot(prev, content, description))
	}, [])

	const getSnapshot = useCallback(
		(id: string) => {
			return getSnapshotById(history, id)
		},
		[history]
	)

	const getLatestSnapshot = useCallback(() => {
		return history.snapshots[0]
	}, [history])

	const getPreviousSnapshot = useCallback(() => {
		return history.snapshots[1]
	}, [history])

	const clearHistory = useCallback(() => {
		setHistory(createTextHistory(maxSnapshots))
	}, [maxSnapshots])

	const snapshotCount = useMemo(() => history.snapshots.length, [history.snapshots])

	return {
		history: history.snapshots,
		saveSnapshot,
		getSnapshot,
		getLatestSnapshot,
		getPreviousSnapshot,
		clearHistory,
		snapshotCount,
	}
}
