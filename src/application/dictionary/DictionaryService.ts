import { DictionarySearchResult } from '@/infra/dictionary/EmbeddedDictionaryService'
import { EmbeddedDictionaryService } from '@/infra/dictionary/EmbeddedDictionaryService'

/**
 * 辞書検索サービス（Application層）
 * 内蔵辞書を使用して日本語の意味を取得
 */
export class DictionaryService {
	private embeddedService: EmbeddedDictionaryService

	constructor() {
		this.embeddedService = new EmbeddedDictionaryService()
	}

	/**
	 * 単語を検索（日本語の意味のみを返す）
	 */
	async searchWord(query: string): Promise<DictionarySearchResult> {
		// 内蔵辞書で検索
		const result = await this.embeddedService.searchWord(query)
		return result
	}
}

// シングルトンインスタンス
export const dictionaryService = new DictionaryService()
