export interface DiffService {
	generateUnifiedDiff(
		fileNameOld: string,
		fileNameNew: string,
		oldText: string,
		newText: string
	): string
}
