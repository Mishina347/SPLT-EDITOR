import { useState, useEffect, useCallback } from 'react'
import { dictionaryService } from '@/application/dictionary/DictionaryService'
import { DictionarySearchResult } from '@/infra/dictionary/EmbeddedDictionaryService'
import { logger } from '@/utils/logger'

interface UseDictionaryProps {
	selectedText: string | undefined
}

export const useDictionary = ({ selectedText }: UseDictionaryProps) => {
	const [searchResult, setSearchResult] = useState<DictionarySearchResult | null>(null)
	const [isLoading, setIsLoading] = useState(false)
	const [error, setError] = useState<string | null>(null)

	const searchWord = useCallback(async (query: string) => {
		if (!query || query.trim().length === 0) {
			setSearchResult(null)
			return
		}

		const trimmedQuery = query.trim()
		setIsLoading(true)
		setError(null)

		try {
			logger.debug('useDictionary', `Searching for: "${trimmedQuery}"`)
			const result = await dictionaryService.searchWord(trimmedQuery)
			logger.debug('useDictionary', `Search completed for: "${trimmedQuery}"`, {
				entriesCount: result.entries.length,
				query: result.query,
			})

			if (result.entries.length === 0) {
				logger.debug('useDictionary', `No results found for: "${trimmedQuery}"`)
			}

			setSearchResult(result)
		} catch (err) {
			const errorMessage = err instanceof Error ? err.message : '辞書検索に失敗しました'
			setError(errorMessage)
			logger.error('useDictionary', `Search failed for: "${trimmedQuery}"`, err)
			setSearchResult(null)
		} finally {
			setIsLoading(false)
		}
	}, [])

	// 選択テキストが変更されたら自動検索
	useEffect(() => {
		if (selectedText && selectedText.trim().length > 0) {
			// デバウンス処理（500ms）
			const timeoutId = setTimeout(() => {
				searchWord(selectedText)
			}, 500)

			return () => clearTimeout(timeoutId)
		} else {
			setSearchResult(null)
		}
	}, [selectedText, searchWord])

	return {
		searchResult,
		isLoading,
		error,
		searchWord,
	}
}
