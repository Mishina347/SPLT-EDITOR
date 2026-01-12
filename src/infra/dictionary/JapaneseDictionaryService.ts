/**
 * 日本語辞書サービス
 * Weblio辞書APIを使用して日本語の意味を取得
 */

import { isTauri } from '@/utils'
import { DictionaryEntry, DictionarySearchResult } from './JishoDictionaryService'

export class JapaneseDictionaryService {
	// Weblio辞書の検索URL
	// 開発環境ではViteのプロキシを使用、本番環境では直接アクセス
	private readonly WEBLIO_API_URL = import.meta.env.DEV
		? '/api/weblio/content' // Viteプロキシ経由
		: 'https://www.weblio.jp/content' // 直接アクセス

	/**
	 * HTTPリクエストを実行（CORS対応）
	 */
	private async fetchWithCors(url: string): Promise<Response> {
		// Tauri環境の場合は直接fetchを使用
		if (isTauri()) {
			try {
				const response = await fetch(url, {
					method: 'GET',
					headers: {
						'Content-Type': 'text/html; charset=utf-8',
						'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
					},
				})
				return response
			} catch (error) {
				console.error('JapaneseDictionaryService: Tauri fetch failed', error)
				throw error
			}
		}

		// 開発環境ではViteのプロキシを使用（/api/weblioで始まるURL）
		if (import.meta.env.DEV && url.startsWith('/api/weblio')) {
			try {
				console.log('JapaneseDictionaryService: Using Vite proxy:', url)
				const response = await fetch(url, {
					method: 'GET',
					headers: {
						'Content-Type': 'text/html; charset=utf-8',
					},
				})

				if (response.ok) {
					console.log('JapaneseDictionaryService: Vite proxy succeeded')
					return response
				}
			} catch (error) {
				console.error('JapaneseDictionaryService: Vite proxy failed', error)
				// フォールバックとしてCORSプロキシを試す
			}
		}

		// ブラウザ環境（本番）ではCORSプロキシを使用
		// より信頼性の高いプロキシを最初に試す
		// allorigins.winは/get?url=形式を使用（/raw?url=はpreflightで失敗する可能性がある）
		const CORS_PROXIES: Array<{ url: string; format: 'query' | 'get' }> = [
			{ url: 'https://corsproxy.io/', format: 'query' },
			{ url: 'https://api.allorigins.win/get?url=', format: 'get' },
			{ url: 'https://api.allorigins.win/raw?url=', format: 'query' },
		]

		// 本番環境（ブラウザ環境）では直接アクセスを試みない（CORSエラーを避ける）
		// 開発環境でのみ直接アクセスを試みる（Viteプロキシ経由の場合）
		if (import.meta.env.DEV && url.startsWith('/api/weblio')) {
			// 開発環境でViteプロキシ経由の場合は既に上で処理済み
			// ここには到達しないはずだが、念のため
		} else {
			// 本番環境では直接アクセスを試みない（CORSエラーを避ける）
			console.log('JapaneseDictionaryService: Skipping direct fetch in production, using proxy')
		}

		// CORSプロキシを使用
		for (const proxy of CORS_PROXIES) {
			try {
				let proxyUrl: string
				if (proxy.format === 'get') {
					// /get?url=形式の場合、レスポンスはJSON形式で返される
					proxyUrl = `${proxy.url}${encodeURIComponent(url)}`
				} else {
					// /raw?url=またはquery形式の場合
					proxyUrl = `${proxy.url}${encodeURIComponent(url)}`
				}

				console.log('JapaneseDictionaryService: Trying proxy:', proxy.url)

				// ヘッダーを最小限にしてpreflightリクエストを避ける
				const response = await fetch(proxyUrl, {
					mode: 'cors',
					// カスタムヘッダーを削除してpreflightを避ける
				})

				if (response.ok) {
					// /get?url=形式の場合はJSONからcontentsを取得
					if (proxy.format === 'get') {
						const json = await response.json()
						if (json.contents) {
							// JSONレスポンスからcontentsを取得して、新しいResponseオブジェクトを作成
							return new Response(json.contents, {
								status: 200,
								statusText: 'OK',
								headers: {
									'Content-Type': 'text/html; charset=utf-8',
								},
							})
						}
					} else {
						console.log('JapaneseDictionaryService: Proxy succeeded:', proxy.url)
						return response
					}
				} else {
					console.warn(`JapaneseDictionaryService: Proxy ${proxy.url} returned status:`, response.status)
				}
			} catch (error) {
				console.warn(`JapaneseDictionaryService: Proxy ${proxy.url} failed`, error)
				continue
			}
		}

		throw new Error('All fetch methods failed. Please check the console for details.')
	}

	/**
	 * HTMLから日本語の意味を抽出
	 */
	private extractMeaningsFromHTML(html: string): string[] {
		const meanings: string[] = []

		// Weblio辞書のHTML構造から意味を抽出
		// デバッグ用：HTMLの一部をログに出力
		console.log('JapaneseDictionaryService: HTML length:', html.length)
		if (html.length < 50000) {
			console.log('JapaneseDictionaryService: HTML sample:', html.substring(0, 2000))
		}

		// 1. content-explanation クラスから意味を抽出
		const contentExplanationPattern =
			/<div[^>]*class="[^"]*content-explanation[^"]*"[^>]*>([\s\S]*?)<\/div>/gi
		let match
		while ((match = contentExplanationPattern.exec(html)) !== null) {
			const content = this.cleanHTML(match[1])
			if (content && this.isJapaneseText(content)) {
				meanings.push(content)
			}
		}

		// 2. NetDicBody クラスから意味を抽出
		const netDicBodyPattern = /<div[^>]*class="[^"]*NetDicBody[^"]*"[^>]*>([\s\S]*?)<\/div>/gi
		while ((match = netDicBodyPattern.exec(html)) !== null) {
			const content = this.cleanHTML(match[1])
			if (content && this.isJapaneseText(content)) {
				meanings.push(content)
			}
		}

		// 3. kiji クラスから意味を抽出
		const kijiPattern = /<div[^>]*class="[^"]*kiji[^"]*"[^>]*>([\s\S]*?)<\/div>/gi
		while ((match = kijiPattern.exec(html)) !== null) {
			const content = this.cleanHTML(match[1])
			if (content && this.isJapaneseText(content) && content.length > 10) {
				meanings.push(content)
			}
		}

		// 4. 意味説明の一般的なパターン
		const meaningPatterns = [
			/<p[^>]*class="[^"]*meaning[^"]*"[^>]*>([\s\S]*?)<\/p>/gi,
			/<div[^>]*class="[^"]*meaning[^"]*"[^>]*>([\s\S]*?)<\/div>/gi,
			/<span[^>]*class="[^"]*explanation[^"]*"[^>]*>([\s\S]*?)<\/span>/gi,
		]

		for (const pattern of meaningPatterns) {
			while ((match = pattern.exec(html)) !== null) {
				const content = this.cleanHTML(match[1])
				if (content && this.isJapaneseText(content) && content.length > 5) {
					meanings.push(content)
				}
			}
		}

		// 重複を削除し、長さでソート（長いものほど詳細な説明の可能性が高い）
		const uniqueMeanings = Array.from(new Set(meanings))
			.filter(m => m.length > 5) // 短すぎるものを除外
			.sort((a, b) => b.length - a.length) // 長い順にソート

		console.log('JapaneseDictionaryService: Extracted meanings:', uniqueMeanings.length)
		return uniqueMeanings
	}

	/**
	 * HTMLタグを削除してテキストのみを抽出
	 */
	private cleanHTML(html: string): string {
		// HTMLタグを削除
		let text = html.replace(/<[^>]+>/g, ' ')
		// HTMLエンティティをデコード
		text = text
			.replace(/&nbsp;/g, ' ')
			.replace(/&amp;/g, '&')
			.replace(/&lt;/g, '<')
			.replace(/&gt;/g, '>')
			.replace(/&quot;/g, '"')
			.replace(/&#39;/g, "'")
		// 連続する空白を1つに統一
		text = text.replace(/\s+/g, ' ').trim()
		return text
	}

	/**
	 * テキストが日本語を含むかどうかを判定
	 */
	private isJapaneseText(text: string): boolean {
		// ひらがな、カタカナ、漢字を含むか
		return /[\u3040-\u309F\u30A0-\u30FF\u4E00-\u9FAF]/.test(text)
	}

	/**
	 * 単語を日本語辞書で検索
	 */
	async searchWord(query: string): Promise<DictionarySearchResult> {
		if (!query || query.trim().length === 0) {
			return { query: query.trim(), entries: [] }
		}

		const trimmedQuery = query.trim()

		try {
			// Weblio辞書の検索URL（実際のURL構造に合わせる）
			const url = `${this.WEBLIO_API_URL}/${encodeURIComponent(trimmedQuery)}`
			console.log('JapaneseDictionaryService: Searching URL:', url)

			const response = await this.fetchWithCors(url)
			if (!response.ok) {
				console.error('JapaneseDictionaryService: API error', response.status, response.statusText)
				return {
					query: trimmedQuery,
					entries: [],
				}
			}

			const html = await response.text()

			// HTMLが空またはエラーページの場合は空の結果を返す
			if (!html || html.length < 100) {
				console.log('JapaneseDictionaryService: Empty or invalid HTML response')
				return {
					query: trimmedQuery,
					entries: [],
				}
			}

			const meanings = this.extractMeaningsFromHTML(html)

			if (meanings.length === 0) {
				console.log('JapaneseDictionaryService: No meanings found in HTML')
				// HTMLの一部をログに出力してデバッグ
				console.log('JapaneseDictionaryService: HTML preview:', html.substring(0, 1000))
				return {
					query: trimmedQuery,
					entries: [],
				}
			}

			// 読み方を抽出（Weblio辞書のHTML構造から）
			const readingMatch = html.match(/<span[^>]*class="[^"]*phonetic[^"]*"[^>]*>([^<]+)<\/span>/i)
			const reading = readingMatch ? readingMatch[1].trim() : ''

			const entry: DictionaryEntry = {
				word: trimmedQuery,
				reading: reading,
				senses: meanings.slice(0, 10), // 最大10個の意味を返す
				common: false,
				tags: [],
				partsOfSpeech: [],
			}

			console.log('JapaneseDictionaryService: Found entry:', {
				word: entry.word,
				reading: entry.reading,
				meaningsCount: entry.senses.length,
			})

			return {
				query: trimmedQuery,
				entries: [entry],
			}
		} catch (error) {
			console.error('JapaneseDictionaryService: Search error', error)
			return {
				query: trimmedQuery,
				entries: [],
			}
		}
	}
}
