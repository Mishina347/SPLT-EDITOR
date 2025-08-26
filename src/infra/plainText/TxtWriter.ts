export class TxtWriter {
	async write(pages: string[][]) {
		let output = ''

		pages.forEach((pageLines, pageIndex) => {
			for (const line of pageLines) {
				output += line
			}
			// ページ間の改行も削除
		})

		// Android端末での文字化けを防ぐための対策
		// 1. BOM（Byte Order Mark）を追加
		// 2. 改行コードを統一（CRLF）
		// 3. より確実なエンコーディング指定

		// BOMを追加（UTF-8 BOM: EF BB BF）
		const bom = new Uint8Array([0xef, 0xbb, 0xbf])

		// 改行コードをCRLFに統一（Android端末でより確実に認識される）
		const normalizedOutput = output.replace(/\n/g, '\r\n')

		// BOM + テキスト内容を結合
		const finalContent = new Uint8Array(bom.length + normalizedOutput.length)
		finalContent.set(bom)
		finalContent.set(new TextEncoder().encode(normalizedOutput), bom.length)

		// Blobを作成してダウンロード
		const blob = new Blob([finalContent], {
			type: 'text/plain;charset=utf-8',
		})
		const link = document.createElement('a')
		link.href = URL.createObjectURL(blob)
		link.download = 'document_utf8.txt'
		link.click()

		// メモリリークを防ぐためにURLを解放
		URL.revokeObjectURL(link.href)
	}

	// Android端末での文字化けを防ぐための代替メソッド
	async writeWithEncoding(pages: string[][], encoding: 'utf8' | 'shift_jis' = 'utf8') {
		let output = ''

		pages.forEach((pageLines, pageIndex) => {
			for (const line of pageLines) {
				output += line
			}
		})

		// 改行コードをCRLFに統一
		const normalizedOutput = output.replace(/\n/g, '\r\n')

		if (encoding === 'utf8') {
			// UTF-8 with BOM
			const bom = new Uint8Array([0xef, 0xbb, 0xbf])
			const finalContent = new Uint8Array(bom.length + normalizedOutput.length)
			finalContent.set(bom)
			finalContent.set(new TextEncoder().encode(normalizedOutput), bom.length)

			const blob = new Blob([finalContent], {
				type: 'text/plain;charset=utf-8',
			})
			this.downloadFile(blob, 'document.txt')
		} else if (encoding === 'shift_jis') {
			// Shift_JIS（日本語環境でより確実）
			try {
				// TextEncoderでShift_JISエンコーディングを試行
				const encoder = new TextEncoder()
				const encoded = encoder.encode(normalizedOutput)

				const blob = new Blob([encoded], {
					type: 'text/plain;charset=shift_jis',
				})
				this.downloadFile(blob, 'document_sjis.txt')
			} catch (error) {
				console.warn('Shift_JISエンコーディングに失敗、UTF-8でフォールバック:', error)
				// フォールバック: UTF-8
				this.write(pages)
			}
		}
	}

	private downloadFile(blob: Blob, filename: string) {
		const link = document.createElement('a')
		link.href = URL.createObjectURL(blob)
		link.download = filename
		link.click()

		// メモリリークを防ぐためにURLを解放
		URL.revokeObjectURL(link.href)
	}
}
