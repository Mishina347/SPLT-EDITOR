import { createTwoFilesPatch } from 'diff'
import { DiffService } from '../domain/preview/diff/DiffService'

export class Diff2HtmlAdapter implements DiffService {
	generateUnifiedDiff(
		fileNameOld: string,
		fileNameNew: string,
		oldText: string,
		newText: string
	): string {
		return createTwoFilesPatch(fileNameOld, fileNameNew, oldText, newText)
	}
}
