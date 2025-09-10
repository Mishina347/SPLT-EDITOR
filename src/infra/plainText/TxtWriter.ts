import { isAndroid, isIOS } from '@/utils/deviceDetection'

export class TxtWriter {
	async write(pages: string[][], filename?: string) {
		let output = ''

		pages.forEach((pageLines, pageIndex) => {
			// 各行の間に改行を入れて結合
			output += pageLines.join('\n')
			// ページ間には余計な改行を入れない
		})

		// プラットフォーム別の最適化された文字化け対策
		const platform = this.detectPlatform()
		const optimizedContent = this.optimizeForPlatform(output, platform, filename)

		// Blobを作成してダウンロード
		const blob = new Blob([optimizedContent.data], {
			type: `text/plain;charset=${optimizedContent.charset}`,
		})
		const link = document.createElement('a')
		link.href = URL.createObjectURL(blob)
		link.download = optimizedContent.filename
		link.click()

		// メモリリークを防ぐためにURLを解放
		URL.revokeObjectURL(link.href)
	}

	private detectPlatform(): 'android' | 'ios' | 'desktop' {
		if (isAndroid()) return 'android'
		if (isIOS()) return 'ios'
		return 'desktop'
	}

	private optimizeForPlatform(
		text: string,
		platform: 'android' | 'ios' | 'desktop',
		customFilename?: string
	) {
		switch (platform) {
			case 'android':
				// Android端末: 最も確実な文字化け対策
				return this.optimizeForAndroid(text, customFilename)
			case 'ios':
				// iOS端末: 標準的なUTF-8出力
				return this.optimizeForIOS(text, customFilename)
			case 'desktop':
			default:
				// デスクトップ: 標準的なUTF-8出力
				return this.optimizeForDesktop(text, customFilename)
		}
	}

	private optimizeForAndroid(text: string, customFilename?: string) {
		// Android端末での文字化けを防ぐための最強対策
		// 1. BOM（Byte Order Mark）を追加
		// 2. 改行コードをCRLFに統一
		// 3. 明示的なcharset指定

		const bom = new Uint8Array([0xef, 0xbb, 0xbf])
		const normalizedOutput = text.replace(/\n/g, '\r\n')
		const encodedText = new TextEncoder().encode(normalizedOutput)

		const finalContent = new Uint8Array(bom.length + encodedText.length)
		finalContent.set(bom)
		finalContent.set(encodedText, bom.length)

		return {
			data: finalContent,
			charset: 'utf-8',
			filename: customFilename || 'document_android_utf8.txt',
		}
	}

	private optimizeForIOS(text: string, customFilename?: string) {
		// iOS端末: 標準的なUTF-8出力（BOMなし）
		// iOSのテキストビューアーはUTF-8対応が良好

		const normalizedOutput = text.replace(/\n/g, '\n') // LFのまま保持
		const encodedText = new TextEncoder().encode(normalizedOutput)

		return {
			data: encodedText,
			charset: 'utf-8',
			filename: customFilename || 'document_ios_utf8.txt',
		}
	}

	private optimizeForDesktop(text: string, customFilename?: string) {
		// デスクトップ: 標準的なUTF-8出力
		// モダンブラウザはUTF-8対応が良好

		const normalizedOutput = text.replace(/\n/g, '\n') // LFのまま保持
		const encodedText = new TextEncoder().encode(normalizedOutput)

		return {
			data: encodedText,
			charset: 'utf-8',
			filename: customFilename || 'document_desktop_utf8.txt',
		}
	}

	// プラットフォーム別の最適化されたエンコーディング選択メソッド
	async writeWithEncoding(
		pages: string[][],
		encoding: 'utf8' | 'shift_jis' = 'utf8',
		filename?: string
	) {
		let output = ''

		pages.forEach((pageLines, pageIndex) => {
			// 各行の間に改行を入れて結合
			output += pageLines.join('\n')
		})

		const platform = this.detectPlatform()
		let optimizedContent: { data: Uint8Array; charset: string; filename: string }

		if (encoding === 'utf8') {
			// UTF-8: プラットフォーム別最適化
			optimizedContent = this.optimizeForPlatform(output, platform, filename)
		} else if (encoding === 'shift_jis') {
			// Shift_JIS: プラットフォーム別最適化 + エンコーディング指定
			optimizedContent = this.optimizeForShiftJIS(output, platform, filename)
		} else {
			// デフォルト: プラットフォーム別最適化
			optimizedContent = this.optimizeForPlatform(output, platform, filename)
		}

		// ファイルをダウンロード
		this.downloadFile(
			new Blob([optimizedContent.data as BlobPart], {
				type: `text/plain;charset=${optimizedContent.charset}`,
			}),
			optimizedContent.filename
		)
	}

	private optimizeForShiftJIS(
		text: string,
		platform: 'android' | 'ios' | 'desktop',
		customFilename?: string
	) {
		// Shift_JISエンコーディングの最適化
		// 注意: 実際のShift_JISエンコーディングには別途ライブラリが必要

		try {
			// 現在はTextEncoder（UTF-8）を使用
			const normalizedOutput = text.replace(/\n/g, platform === 'android' ? '\r\n' : '\n')
			const encodedText = new TextEncoder().encode(normalizedOutput)

			// プラットフォーム別のファイル名
			const filename = customFilename || `document_${platform}_shiftjis_fallback.txt`

			return {
				data: encodedText,
				charset: 'utf-8', // 実際はUTF-8
				filename,
			}
		} catch (error) {
			console.warn('Shift_JISエンコーディングに失敗、UTF-8でフォールバック:', error)
			// フォールバック: プラットフォーム別最適化
			return this.optimizeForPlatform(text, platform, customFilename)
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
