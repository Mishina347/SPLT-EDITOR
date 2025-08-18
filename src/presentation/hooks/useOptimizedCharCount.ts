import { useState, useCallback, useMemo, useRef, useEffect } from 'react'
import { calculateCharCount } from '../../domain/text/calculateCharCount'
import { createThrottledHandler, TextProcessor } from '../../utils/performanceOptimizer'

interface CharCountState {
	characters: number
	lines: number
	words: number
}

interface UseOptimizedCharCountOptions {
	throttleDelay?: number
	enableBatching?: boolean
	asyncThreshold?: number
}

/**
 * 最適化された文字数カウントフック
 */
export function useOptimizedCharCount(options: UseOptimizedCharCountOptions = {}) {
	const { throttleDelay = 300, enableBatching = true, asyncThreshold = 10000 } = options

	const [currentText, setCurrentText] = useState('')
	const [charCount, setCharCount] = useState<CharCountState>({
		characters: 0,
		lines: 0,
		words: 0,
	})
	const [isCalculating, setIsCalculating] = useState(false)

	// 計算キャッシュ
	const cacheRef = useRef(new Map<string, CharCountState>())
	const lastCalculationRef = useRef<string>('')

	// 非同期計算のキャンセル用
	const abortControllerRef = useRef<AbortController | null>(null)

	/**
	 * 高速文字数計算（同期）
	 */
	const calculateCountSync = useCallback((text: string): CharCountState => {
		// キャッシュチェック
		const cacheKey = generateTextHash(text)
		const cached = cacheRef.current.get(cacheKey)

		if (cached) {
			return cached
		}

		// 計算実行
		const result = TextProcessor.countCharactersOptimized(text)

		// キャッシュ保存（サイズ制限）
		if (cacheRef.current.size > 50) {
			// 古いキャッシュを削除（LRU風）
			const firstKey = cacheRef.current.keys().next().value
			if (firstKey) {
				cacheRef.current.delete(firstKey)
			}
		}
		cacheRef.current.set(cacheKey, result)

		return result
	}, [])

	/**
	 * 非同期文字数計算（大きなテキスト用）
	 */
	const calculateCountAsync = useCallback(async (text: string): Promise<CharCountState> => {
		setIsCalculating(true)

		try {
			// 前の計算をキャンセル
			if (abortControllerRef.current) {
				abortControllerRef.current.abort()
			}

			const abortController = new AbortController()
			abortControllerRef.current = abortController

			// チャンク処理で計算
			const chunks = await TextProcessor.processTextInChunks(
				text,
				chunk => TextProcessor.countCharactersOptimized(chunk),
				progress => {
					// 進捗は必要に応じて使用
				}
			)

			// キャンセルチェック
			if (abortController.signal.aborted) {
				throw new Error('Calculation cancelled')
			}

			// 結果をマージ
			const result = chunks.reduce(
				(total, chunk) => ({
					characters: total.characters + chunk.characters,
					lines: total.lines + chunk.lines - 1, // 重複する改行を調整
					words: total.words + chunk.words,
				}),
				{ characters: 0, lines: 1, words: 0 }
			)

			return result
		} finally {
			setIsCalculating(false)
			abortControllerRef.current = null
		}
	}, [])

	/**
	 * 文字数計算のメイン処理
	 */
	const performCalculation = useCallback(
		async (text: string) => {
			// 同じテキストの重複計算を避ける
			if (text === lastCalculationRef.current) {
				return
			}
			lastCalculationRef.current = text

			try {
				let result: CharCountState

				if (text.length > asyncThreshold) {
					// 大きなテキストは非同期処理
					result = await calculateCountAsync(text)
				} else {
					// 小さなテキストは同期処理
					result = calculateCountSync(text)
				}

				setCharCount(result)
			} catch (error) {
				console.error('Character count calculation failed:', error)
				// エラー時はフォールバック
				const fallback = calculateCharCount(text)
				setCharCount({
					characters: fallback,
					lines: text.split('\n').length,
					words: text.split(/\s+/).filter(word => word.length > 0).length,
				})
			}
		},
		[asyncThreshold, calculateCountAsync, calculateCountSync]
	)

	/**
	 * スロットル化された更新処理
	 */
	const throttledUpdate = useMemo(
		() => createThrottledHandler(performCalculation, throttleDelay),
		[performCalculation, throttleDelay]
	)

	/**
	 * テキスト更新
	 */
	const updateText = useCallback(
		(newText: string) => {
			setCurrentText(newText)

			if (enableBatching) {
				// バッチ処理で更新
				throttledUpdate(newText)
			} else {
				// 即座に更新
				void performCalculation(newText)
			}
		},
		[enableBatching, throttledUpdate, performCalculation]
	)

	/**
	 * 即座に計算実行（強制更新）
	 */
	const forceUpdate = useCallback(() => {
		void performCalculation(currentText)
	}, [currentText, performCalculation])

	/**
	 * キャッシュクリア
	 */
	const clearCache = useCallback(() => {
		cacheRef.current.clear()
	}, [])

	// クリーンアップ
	useEffect(() => {
		return () => {
			if (abortControllerRef.current) {
				abortControllerRef.current.abort()
			}
		}
	}, [])

	return {
		currentText,
		charCount,
		isCalculating,
		updateText,
		forceUpdate,
		clearCache,
	}
}

/**
 * テキストの簡易ハッシュ生成
 */
function generateTextHash(text: string): string {
	if (text.length < 100) {
		return text
	}

	// 長いテキストの場合は一部をサンプリング
	const sample = text.slice(0, 50) + text.slice(-50) + text.length.toString()

	let hash = 0
	for (let i = 0; i < sample.length; i++) {
		const char = sample.charCodeAt(i)
		hash = (hash << 5) - hash + char
		hash = hash & hash // 32bit整数に変換
	}

	return hash.toString(36)
}
