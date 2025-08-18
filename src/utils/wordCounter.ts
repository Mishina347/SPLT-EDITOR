export function wordCounter(text: string) {
	const characterCount = text.replace('\n', '').length
	const lineCount = text.split('\n').length
	const wordCount = text.trim() === '' ? 0 : text.trim().split(/\s+/).length
	return { characterCount, lineCount, wordCount }
}
