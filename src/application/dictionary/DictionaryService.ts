import {
	JishoDictionaryService,
	DictionarySearchResult,
} from '@/infra/dictionary/JishoDictionaryService'
import { JapaneseDictionaryService } from '@/infra/dictionary/JapaneseDictionaryService'

/**
 * 辞書検索サービス（Application層）
 * Jisho APIと日本語辞書APIを併用して、日本語の意味を優先的に取得
 */
export class DictionaryService {
	private jishoService: JishoDictionaryService
	private japaneseService: JapaneseDictionaryService

	constructor() {
		this.jishoService = new JishoDictionaryService()
		this.japaneseService = new JapaneseDictionaryService()
	}

	/**
	 * 単語を検索（日本語の意味のみを返す）
	 */
	async searchWord(query: string): Promise<DictionarySearchResult> {
		// まず日本語辞書APIで検索
		const japaneseResult = await this.japaneseService.searchWord(query)
		
		// 日本語の意味が見つかった場合はそれを返す
		if (japaneseResult.entries.length > 0 && japaneseResult.entries[0].senses.length > 0) {
			return japaneseResult
		}

		// 日本語の意味が見つからない場合はJisho APIで検索
		const jishoResult = await this.jishoService.searchWord(query)
		
		// Jisho APIの結果で日本語の意味があるもののみを返す
		// （既にJishoDictionaryServiceで日本語の意味がないエントリは除外されている）
		return jishoResult
	}
}

// シングルトンインスタンス
export const dictionaryService = new DictionaryService()
