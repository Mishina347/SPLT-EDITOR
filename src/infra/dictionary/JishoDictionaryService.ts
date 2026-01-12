/**
 * Jisho APIを使用した日本語辞書サービス
 * https://jisho.org/api
 */

import { isTauri } from '@/utils'

export interface DictionaryEntry {
	word: string
	reading: string
	senses: string[]
	common: boolean
	tags: string[]
	partsOfSpeech: string[]
}

export interface DictionarySearchResult {
	query: string
	entries: DictionaryEntry[]
}

export class JishoDictionaryService {
	// 開発環境ではViteのプロキシを使用、本番環境ではCORSプロキシを使用
	private readonly API_BASE_URL = import.meta.env.DEV
		? '/api/jisho/api/v1/search/words' // Viteプロキシ経由
		: 'https://jisho.org/api/v1/search/words' // 直接アクセス
	
	// CORSプロキシのリスト（フォールバック用）
	private readonly CORS_PROXIES = [
		'https://api.allorigins.win/raw?url=',
	]

	/**
	 * 検索クエリを前処理（改行・タブの削除、長すぎる場合は切り詰め）
	 * 日本語の場合は空白を保持する
	 */
	private preprocessQuery(query: string): string {
		// 改行、タブを削除（空白は保持）
		let processed = query.replace(/[\n\t\r]+/g, ' ').trim()

		// 連続する空白を1つに統一
		processed = processed.replace(/\s+/g, ' ')

		// 長すぎる場合は最初の30文字まで
		if (processed.length > 30) {
			// 単語の境界で切る（空白で区切る）
			const words = processed.substring(0, 30).split(' ')
			if (words.length > 1) {
				words.pop() // 最後の不完全な単語を削除
			}
			processed = words.join(' ').trim()
		}

		return processed
	}

	/**
	 * HTTPリクエストを実行（CORS対応）
	 */
	private async fetchWithCors(url: string): Promise<Response> {
		// Tauri環境の場合は直接fetchを使用（CORSの問題は発生しない）
		if (isTauri()) {
			try {
				const response = await fetch(url, {
					method: 'GET',
					headers: {
						'Content-Type': 'application/json',
					},
				})
				return response
			} catch (error) {
				console.error('JishoDictionaryService: Tauri fetch failed', error)
				throw error
			}
		}

		// ブラウザ環境ではCORSプロキシを使用
		// まず直接アクセスを試みる（一部のAPIはCORSを許可している場合がある）
		try {
			const directResponse = await fetch(url, {
				mode: 'cors',
				headers: {
					'Content-Type': 'application/json',
				},
			})
			
			if (directResponse.ok) {
				return directResponse
			}
		} catch (error) {
			console.log('JishoDictionaryService: Direct fetch failed (CORS), trying proxy', error)
		}

		// CORSプロキシを使用
		for (const proxy of this.CORS_PROXIES) {
			try {
				const proxyUrl = `${proxy}${encodeURIComponent(url)}`
				console.log('JishoDictionaryService: Trying proxy:', proxy)
				const response = await fetch(proxyUrl, {
					mode: 'cors',
					headers: {
						'Content-Type': 'application/json',
					},
				})
				
				if (response.ok) {
					console.log('JishoDictionaryService: Proxy succeeded:', proxy)
					return response
				}
			} catch (error) {
				console.warn(`JishoDictionaryService: Proxy ${proxy} failed`, error)
				continue
			}
		}

		throw new Error('All fetch methods failed. CORS proxy may be unavailable.')
	}

	/**
	 * 単語を辞書で検索
	 */
	async searchWord(query: string): Promise<DictionarySearchResult> {
		if (!query || query.trim().length === 0) {
			return { query: query.trim(), entries: [] }
		}

		const processedQuery = this.preprocessQuery(query)
		if (processedQuery.length === 0) {
			return { query: query.trim(), entries: [] }
		}

		try {
			const url = `${this.API_BASE_URL}?keyword=${encodeURIComponent(processedQuery)}`
			console.log('JishoDictionaryService: Searching URL:', url)

			const response = await this.fetchWithCors(url)
			if (!response.ok) {
				console.error('JishoDictionaryService: API error', response.status, response.statusText)
				throw new Error(`Dictionary API error: ${response.status} ${response.statusText}`)
			}

			const data = await response.json()
			console.log('JishoDictionaryService: API response:', {
				hasData: !!data,
				dataIsArray: Array.isArray(data?.data),
				dataLength: data?.data?.length || 0,
			})
			// デバッグ用：最初のエントリの詳細をログに出力
			if (data?.data && data.data.length > 0) {
				console.log('JishoDictionaryService: First entry structure:', JSON.stringify(data.data[0], null, 2))
			}

			// レスポンスが空の場合やdataが配列でない場合の処理
			if (!data || !Array.isArray(data.data) || data.data.length === 0) {
				console.log('JishoDictionaryService: No results found')
				return {
					query: processedQuery,
					entries: [],
				}
			}

			const entries: DictionaryEntry[] = data.data
				.map((item: any, index: number) => {
					try {
						// 複数のjapaneseエントリがある場合は最初のものを使用
						const japanese = item.japanese && item.japanese.length > 0 ? item.japanese[0] : {}

						// すべてのsensesから日本語の意味のみを取得
						const allSenses: string[] = []
						if (item.senses && Array.isArray(item.senses)) {
							item.senses.forEach((sense: any) => {
								// 日本語の意味のみを取得
								
								// 1. japanese_definitions（日本語の定義）
								if (sense.japanese_definitions && Array.isArray(sense.japanese_definitions)) {
									allSenses.push(...sense.japanese_definitions)
								}
								
								// 2. definitions（定義、日本語の可能性あり）
								if (sense.definitions && Array.isArray(sense.definitions)) {
									// 日本語かどうかを判定（ひらがな、カタカナ、漢字を含むか）
									const japaneseDefinitions = sense.definitions.filter((def: string) => {
										return /[\u3040-\u309F\u30A0-\u30FF\u4E00-\u9FAF]/.test(def)
									})
									if (japaneseDefinitions.length > 0) {
										allSenses.push(...japaneseDefinitions)
									}
								}
								
								// 3. meanings（意味）
								if (sense.meanings && Array.isArray(sense.meanings)) {
									const japaneseMeanings = sense.meanings.filter((meaning: string) => {
										return /[\u3040-\u309F\u30A0-\u30FF\u4E00-\u9FAF]/.test(meaning)
									})
									if (japaneseMeanings.length > 0) {
										allSenses.push(...japaneseMeanings)
									}
								}
								
								// 4. info（追加情報、日本語の可能性あり）
								if (sense.info && Array.isArray(sense.info)) {
									const japaneseInfo = sense.info.filter((info: string) => {
										return /[\u3040-\u309F\u30A0-\u30FF\u4E00-\u9FAF]/.test(info)
									})
									if (japaneseInfo.length > 0) {
										allSenses.push(...japaneseInfo)
									}
								}
							})
						}
						
						// 日本語の意味が見つからない場合は、このエントリをスキップ
						if (allSenses.length === 0) {
							return null
						}

						// 品詞情報を取得
						const partsOfSpeech: string[] = []
						if (item.senses && Array.isArray(item.senses)) {
							item.senses.forEach((sense: any) => {
								if (sense.parts_of_speech && Array.isArray(sense.parts_of_speech)) {
									partsOfSpeech.push(...sense.parts_of_speech)
								}
							})
						}

						const word = japanese.word || japanese.reading || ''
						const reading = japanese.reading || japanese.word || ''

						// wordまたはreadingが空の場合はスキップ
						if (!word && !reading) {
							console.warn('JishoDictionaryService: Entry without word or reading:', item)
							return null
						}

						return {
							word,
							reading,
							senses: allSenses, // 日本語の意味のみ
							common: item.is_common === true,
							tags: Array.isArray(item.tags) ? item.tags : [],
							partsOfSpeech: Array.from(new Set(partsOfSpeech)), // 重複を削除
						}
					} catch (err) {
						console.error(`JishoDictionaryService: Error parsing entry ${index}:`, err, item)
						return null
					}
				})
				.filter((entry): entry is DictionaryEntry => entry !== null && entry.senses.length > 0) // nullと日本語の意味がないエントリを除外

			console.log('JishoDictionaryService: Parsed entries:', entries.length)

			return {
				query: processedQuery,
				entries,
			}
		} catch (error) {
			console.error('Dictionary search error:', error)
			return {
				query: processedQuery,
				entries: [],
			}
		}
	}
}
