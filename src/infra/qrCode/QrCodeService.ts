import QRCode from 'qrcode'

export interface QrCodeOptions {
	width?: number
	margin?: number
	color?: {
		dark?: string
		light?: string
	}
	errorCorrectionLevel?: 'L' | 'M' | 'Q' | 'H'
}

export interface QrCodeResult {
	dataUrl: string
	svg: string
	size: number
}

export class QrCodeService {
	/**
	 * テキストからQRコードを生成する
	 * @param text QRコードにエンコードするテキスト
	 * @param options QRコードのオプション
	 * @returns QRコードの結果（DataURL、SVG、サイズ）
	 */
	async generateQrCode(text: string, options: QrCodeOptions = {}): Promise<QrCodeResult> {
		const {
			width = 256,
			margin = 2,
			color = { dark: '#000000', light: '#FFFFFF' },
			errorCorrectionLevel = 'M',
		} = options

		// 日本語テキストの場合、推奨設定を適用
		const textLength = text.length
		const isJapanese = /[\u3040-\u309F\u30A0-\u30FF\u4E00-\u9FAF]/.test(text)

		let finalOptions = {
			width: options.width || this.getRecommendedSize(textLength),
			margin: options.margin || 2,
			color: options.color || { dark: '#000000', light: '#FFFFFF' },
			errorCorrectionLevel:
				options.errorCorrectionLevel || this.getRecommendedErrorCorrectionLevel(textLength),
		}

		// 日本語テキストの場合はより大きなマージンを使用
		if (isJapanese && !options.margin) {
			finalOptions.margin = 4
		}

		try {
			// DataURL形式でQRコードを生成
			const dataUrl = await QRCode.toDataURL(text, {
				width: finalOptions.width,
				margin: finalOptions.margin,
				color: finalOptions.color,
				errorCorrectionLevel: finalOptions.errorCorrectionLevel,
				type: 'image/png',
			})

			// SVG形式でQRコードを生成
			const svg = await QRCode.toString(text, {
				width: finalOptions.width,
				margin: finalOptions.margin,
				color: finalOptions.color,
				errorCorrectionLevel: finalOptions.errorCorrectionLevel,
				type: 'svg',
			})

			return {
				dataUrl,
				svg,
				size: finalOptions.width,
			}
		} catch (error) {
			throw new Error(
				`QRコード生成に失敗しました: ${error instanceof Error ? error.message : String(error)}`
			)
		}
	}

	/**
	 * QRコードをPNGファイルとしてダウンロードする
	 * @param text QRコードにエンコードするテキスト
	 * @param filename ファイル名（拡張子なし）
	 * @param options QRコードのオプション
	 */
	async downloadQrCodeAsPng(
		text: string,
		filename: string,
		options: QrCodeOptions = {}
	): Promise<void> {
		try {
			const result = await this.generateQrCode(text, options)

			// DataURLからBlobを作成
			const response = await fetch(result.dataUrl)
			const blob = await response.blob()

			// ファイルをダウンロード
			const link = document.createElement('a')
			link.href = URL.createObjectURL(blob)
			link.download = `${filename}.png`
			link.click()

			// メモリリークを防ぐためにURLを解放
			URL.revokeObjectURL(link.href)
		} catch (error) {
			throw new Error(
				`QRコードのダウンロードに失敗しました: ${error instanceof Error ? error.message : String(error)}`
			)
		}
	}

	/**
	 * QRコードをSVGファイルとしてダウンロードする
	 * @param text QRコードにエンコードするテキスト
	 * @param filename ファイル名（拡張子なし）
	 * @param options QRコードのオプション
	 */
	async downloadQrCodeAsSvg(
		text: string,
		filename: string,
		options: QrCodeOptions = {}
	): Promise<void> {
		try {
			const result = await this.generateQrCode(text, options)

			// SVGをBlobとして作成
			const blob = new Blob([result.svg], { type: 'image/svg+xml' })

			// ファイルをダウンロード
			const link = document.createElement('a')
			link.href = URL.createObjectURL(blob)
			link.download = `${filename}.svg`
			link.click()

			// メモリリークを防ぐためにURLを解放
			URL.revokeObjectURL(link.href)
		} catch (error) {
			throw new Error(
				`QRコードのダウンロードに失敗しました: ${error instanceof Error ? error.message : String(error)}`
			)
		}
	}

	/**
	 * テキストの長さに基づいて適切なエラー訂正レベルを決定する
	 * @param textLength テキストの長さ
	 * @returns 推奨されるエラー訂正レベル
	 */
	getRecommendedErrorCorrectionLevel(textLength: number): 'L' | 'M' | 'Q' | 'H' {
		// 日本語テキストの場合、より保守的な設定を使用
		if (textLength <= 50) return 'L'
		if (textLength <= 200) return 'M'
		if (textLength <= 400) return 'Q'
		return 'H'
	}

	/**
	 * テキストの長さに基づいて適切なQRコードサイズを決定する
	 * @param textLength テキストの長さ
	 * @returns 推奨されるQRコードサイズ
	 */
	getRecommendedSize(textLength: number): number {
		// 日本語テキストの場合、より大きなサイズを使用
		if (textLength <= 50) return 200
		if (textLength <= 200) return 256
		if (textLength <= 400) return 320
		return 400
	}
}
