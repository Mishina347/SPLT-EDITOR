export class TxtWriter {
	async write(pages: string[][]) {
		let output = ''

		pages.forEach((pageLines, pageIndex) => {
			for (const line of pageLines) {
				output += line
			}
			// ページ間の改行も削除
		})

		// Blobを作成してダウンロード
		const blob = new Blob([output], { type: 'text/plain;charset=utf-8' })
		const link = document.createElement('a')
		link.href = URL.createObjectURL(blob)
		link.download = 'document.txt'
		link.click()
	}
}
