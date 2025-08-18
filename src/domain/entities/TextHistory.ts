export interface TextSnapshot {
	id: string
	timestamp: Date
	content: string
	description?: string
}

export interface TextHistory {
	snapshots: TextSnapshot[]
	maxSnapshots: number
}

export const createTextHistory = (maxSnapshots: number = 10): TextHistory => ({
	snapshots: [],
	maxSnapshots,
})

export const addSnapshot = (
	history: TextHistory,
	content: string,
	description?: string
): TextHistory => {
	const newSnapshot: TextSnapshot = {
		id: generateId(),
		timestamp: new Date(),
		content,
		description,
	}

	const updatedSnapshots = [newSnapshot, ...history.snapshots]

	// 最大数まで保持
	if (updatedSnapshots.length > history.maxSnapshots) {
		updatedSnapshots.splice(history.maxSnapshots)
	}

	return {
		...history,
		snapshots: updatedSnapshots,
	}
}

export const getSnapshotById = (history: TextHistory, id: string): TextSnapshot | undefined => {
	return history.snapshots.find(snapshot => snapshot.id === id)
}

export const getLatestSnapshot = (history: TextHistory): TextSnapshot | undefined => {
	return history.snapshots[0]
}

export const getPreviousSnapshot = (history: TextHistory): TextSnapshot | undefined => {
	return history.snapshots[1]
}

const generateId = (): string => {
	return Date.now().toString(36) + Math.random().toString(36).substr(2)
}
