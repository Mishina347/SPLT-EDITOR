/**
 * 内蔵辞書サービス
 * 静的辞書ライブラリを使用して日本語の意味を取得
 */

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

/**
 * 内蔵辞書サービス
 *
 * 利用可能な辞書ライブラリ:
 * - EJDict-hand: パブリックドメインの英和辞書データ（約47,000項目）
 * - JMDict: 日本語辞書データ（XML形式、JSON変換可能）
 *
 * 使用方法:
 * 1. npm install で辞書ライブラリをインストール
 * 2. または、public/data/ に辞書データファイルを配置
 */
export class EmbeddedDictionaryService {
	private dictionaryData: Map<string, DictionaryEntry> = new Map()
	private isLoaded: boolean = false
	private loadPromise: Promise<void> | null = null

	/**
	 * 辞書データを読み込む
	 */
	async loadDictionary(): Promise<void> {
		if (this.isLoaded) {
			return
		}

		// 既に読み込み中の場合は、そのPromiseを返す
		if (this.loadPromise) {
			return this.loadPromise
		}

		this.loadPromise = this._loadDictionaryData()
		await this.loadPromise
	}

	/**
	 * 辞書データの実際の読み込み処理
	 */
	private async _loadDictionaryData(): Promise<void> {
		try {
			// 方法1: public/jpn_wn_lmf_glosses_json.txt から読み込む（日本語WordNetデータ）
			try {
				const response = await fetch('/jpn_wn_lmf_glosses_json.txt')
				if (response.ok) {
					const text = await response.text()
					this._parseWordNetData(text)
					this.isLoaded = true
					console.log(
						'EmbeddedDictionaryService: Japanese WordNet loaded from /jpn_wn_lmf_glosses_json.txt',
						{
							wordCount: this.dictionaryData.size,
						}
					)
					return
				}
			} catch (error) {
				console.warn(
					'EmbeddedDictionaryService: Failed to load Japanese WordNet from /jpn_wn_lmf_glosses_json.txt',
					error
				)
			}

			// 方法2: public/data/dictionary.json から読み込む（フォールバック）
			try {
				const response = await fetch('/data/dictionary.json')
				if (response.ok) {
					const data = await response.json()
					this._parseDictionaryData(data)
					this.isLoaded = true
					console.log('EmbeddedDictionaryService: Dictionary loaded from /data/dictionary.json', {
						wordCount: this.dictionaryData.size,
					})
					return
				}
			} catch (error) {
				console.warn('EmbeddedDictionaryService: Failed to load from /data/dictionary.json', error)
			}

			// 方法2: npmパッケージから読み込む（オプション）
			// パッケージがインストールされている場合のみ使用
			// 例: npm install ejdict-hand など
			// 注意: 実際のパッケージ名に合わせて調整してください
			// try {
			//   const dictionaryModule = await import('ejdict-hand')
			//   if (dictionaryModule && dictionaryModule.default) {
			//     this._parseDictionaryData(dictionaryModule.default)
			//     this.isLoaded = true
			//     console.log('EmbeddedDictionaryService: Dictionary loaded from npm package')
			//     return
			//   }
			// } catch (error) {
			//   console.warn('EmbeddedDictionaryService: Failed to load from npm package', error)
			// }

			// どちらも失敗した場合は空の辞書を使用
			console.warn('EmbeddedDictionaryService: No dictionary data found, using empty dictionary')
			this.dictionaryData = new Map()
			this.isLoaded = true
		} catch (error) {
			console.error('EmbeddedDictionaryService: Failed to load dictionary', error)
			this.dictionaryData = new Map()
			this.isLoaded = true
		}
	}

	/**
	 * 日本語WordNetデータ（JSONL形式）をパースしてMapに格納
	 */
	private _parseWordNetData(text: string): void {
		this.dictionaryData.clear()

		const lines = text.split('\n')
		let processedCount = 0

		for (const line of lines) {
			const trimmedLine = line.trim()
			if (!trimmedLine || trimmedLine.length === 0) {
				continue
			}

			try {
				const entry = JSON.parse(trimmedLine)

				// メタデータ行をスキップ（author、urlなどのフィールドがある場合）
				if (entry.author || entry.url || !entry.item) {
					continue
				}

				const word = entry.item
				if (!word) {
					continue
				}

				// 品詞を日本語に変換
				const posMap: { [key: string]: string } = {
					n: '名詞',
					v: '動詞',
					a: '形容詞',
					r: '副詞',
					adv: '副詞',
					adj: '形容詞',
					noun: '名詞',
					verb: '動詞',
				}

				const partsOfSpeech: string[] = []
				if (entry.pos) {
					const pos = posMap[entry.pos] || entry.pos
					partsOfSpeech.push(pos)
				}

				// 既存のエントリがある場合は意味を追加
				const existingEntry = this.dictionaryData.get(word)
				if (existingEntry) {
					// 既存のエントリに意味を追加（重複を避ける）
					const newSenses = Array.isArray(entry.glosses) ? entry.glosses : []
					const combinedSenses = [...existingEntry.senses]
					for (const sense of newSenses) {
						if (!combinedSenses.includes(sense)) {
							combinedSenses.push(sense)
						}
					}
					existingEntry.senses = combinedSenses
					// 同義語も追加
					if (Array.isArray(entry.synonyms)) {
						for (const synonym of entry.synonyms) {
							if (!existingEntry.tags.includes(synonym)) {
								existingEntry.tags.push(synonym)
							}
						}
					}
				} else {
					// 新しいエントリを作成
					this.dictionaryData.set(word, {
						word,
						reading: word, // WordNetには読み方がないため、単語自体を使用
						senses: Array.isArray(entry.glosses) ? entry.glosses : [],
						common: false,
						tags: Array.isArray(entry.synonyms) ? entry.synonyms : [],
						partsOfSpeech,
					})
				}

				processedCount++
			} catch (error) {
				// JSONパースエラーは無視（不正な行をスキップ）
				continue
			}
		}

		console.log('EmbeddedDictionaryService: Processed WordNet entries', {
			processedLines: processedCount,
			uniqueWords: this.dictionaryData.size,
		})
	}

	/**
	 * 辞書データをパースしてMapに格納（従来のJSON形式用）
	 */
	private _parseDictionaryData(data: any): void {
		this.dictionaryData.clear()

		// JSON形式の辞書データをパース
		// 形式は辞書ライブラリによって異なるため、複数の形式に対応
		if (Array.isArray(data)) {
			// 配列形式: [{word: "...", reading: "...", senses: [...]}, ...]
			for (const entry of data) {
				if (entry.word) {
					this.dictionaryData.set(entry.word, {
						word: entry.word,
						reading: entry.reading || entry.word,
						senses: Array.isArray(entry.senses) ? entry.senses : [entry.meaning || ''],
						common: entry.common || false,
						tags: Array.isArray(entry.tags) ? entry.tags : [],
						partsOfSpeech: Array.isArray(entry.partsOfSpeech) ? entry.partsOfSpeech : [],
					})
				}
			}
		} else if (typeof data === 'object') {
			// オブジェクト形式: {word: {reading: "...", senses: [...]}, ...}
			for (const [word, entry] of Object.entries(data)) {
				const entryData = entry as any
				this.dictionaryData.set(word, {
					word,
					reading: entryData.reading || word,
					senses: Array.isArray(entryData.senses)
						? entryData.senses
						: entryData.meaning
							? [entryData.meaning]
							: [],
					common: entryData.common || false,
					tags: Array.isArray(entryData.tags) ? entryData.tags : [],
					partsOfSpeech: Array.isArray(entryData.partsOfSpeech) ? entryData.partsOfSpeech : [],
				})
			}
		}
	}

	/**
	 * 単語を検索
	 */
	async searchWord(query: string): Promise<DictionarySearchResult> {
		if (!query || query.trim().length === 0) {
			return { query: query.trim(), entries: [] }
		}

		// 辞書データが読み込まれていない場合は読み込む
		if (!this.isLoaded) {
			await this.loadDictionary()
		}

		const trimmedQuery = query.trim()
		const entries: DictionaryEntry[] = []

		// 完全一致検索
		const exactMatch = this.dictionaryData.get(trimmedQuery)
		if (exactMatch) {
			entries.push(exactMatch)
		}

		// 部分一致検索（完全一致が見つからない場合、または追加の結果が必要な場合）
		if (entries.length === 0 || entries.length < 10) {
			const lowerQuery = trimmedQuery.toLowerCase()
			for (const entry of this.dictionaryData.values()) {
				if (
					entry.word.toLowerCase().includes(lowerQuery) ||
					entry.reading.toLowerCase().includes(lowerQuery)
				) {
					// 既に追加されている場合はスキップ
					if (entries.some(e => e.word === entry.word)) {
						continue
					}

					entries.push(entry)

					// 最大10件まで返す
					if (entries.length >= 10) {
						break
					}
				}
			}
		}

		return {
			query: trimmedQuery,
			entries,
		}
	}

	/**
	 * 辞書データを手動で設定（テスト用）
	 */
	setDictionaryData(data: any): void {
		this._parseDictionaryData(data)
		this.isLoaded = true
	}

	/**
	 * 辞書データの統計情報を取得
	 */
	getStats(): { wordCount: number; isLoaded: boolean } {
		return {
			wordCount: this.dictionaryData.size,
			isLoaded: this.isLoaded,
		}
	}
}
