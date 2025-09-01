import { useState, useCallback, useMemo, useRef } from 'react'
import { wordCounter } from '@/utils/wordCounter'
import { useDebounce, useThrottledCallback } from '../common'

interface CharCountResult {
	characterCount: number
	lineCount: number
	pageCount: number
}

interface UseOptimizedCharCountConfig {
	/** デバウンス遅延時間（ミリ秒） */
	debounceDelay?: number
	/** キャッシュサイズ */
	cacheSize?: number
	/** 即座に更新する文字数の閾値 */
	immediateUpdateThreshold?: number
}

/**
 * 最適化された文字数カウントフック
 * デバウンス、キャッシュ、スロットリングを組み合わせて高性能化
 */
export function useOptimizedCharCount(config: UseOptimizedCharCountConfig = {}) {
	const { debounceDelay = 300, cacheSize = 100, immediateUpdateThreshold = 1000 } = config

	const [currentText, setCurrentText] = useState('')
	const [charCountResult, setCharCountResult] = useState<CharCountResult>({
		characterCount: 0,
		lineCount: 1,
		pageCount: 1,
	})

	// キャッシュ管理
	const cacheRef = useRef<Map<string, CharCountResult>>(new Map())
	const lastCalculatedTextRef = useRef('')

	// デバウンスされたテキスト（重い計算用）
	const debouncedText = useDebounce(currentText, debounceDelay)

	// 高速な文字数計算（キャッシュ付き）
	const calculateCharCount = useCallback(
		(text: string): CharCountResult => {
			// キャッシュから取得を試行
			const cached = cacheRef.current.get(text)
			if (cached) {
				return cached
			}

			// 計算実行
			const result = wordCounter(text)

			// キャッシュサイズ管理（LRU的な動作）
			if (cacheRef.current.size >= cacheSize) {
				const firstKey = cacheRef.current.keys().next().value
				if (firstKey) {
					cacheRef.current.delete(firstKey)
				}
			}

			// キャッシュに保存
			cacheRef.current.set(text, result)

			return result
		},
		[cacheSize]
	)

	// 即座に更新する場合の処理（軽量な変更用）
	const updateCharCountImmediate = useCallback(
		(text: string) => {
			// 短いテキストの場合は即座に計算
			if (text.length <= immediateUpdateThreshold) {
				const result = calculateCharCount(text)
				setCharCountResult(result)
				lastCalculatedTextRef.current = text
			}
		},
		[calculateCharCount, immediateUpdateThreshold]
	)

	// スロットリングされた即時更新
	const throttledUpdate = useThrottledCallback(
		updateCharCountImmediate,
		100, // 100ms間隔
		[updateCharCountImmediate]
	)

	// デバウンスされたテキストが変更されたときの処理
	useMemo(() => {
		if (debouncedText !== lastCalculatedTextRef.current) {
			const result = calculateCharCount(debouncedText)
			setCharCountResult(result)
			lastCalculatedTextRef.current = debouncedText
		}
	}, [debouncedText, calculateCharCount])

	// テキスト更新関数
	const updateText = useCallback(
		(newText: string) => {
			setCurrentText(newText)

			// 短いテキストの場合は即座に更新
			if (newText.length <= immediateUpdateThreshold) {
				throttledUpdate(newText)
			}
		},
		[immediateUpdateThreshold, throttledUpdate]
	)

	// キャッシュクリア関数
	const clearCache = useCallback(() => {
		cacheRef.current.clear()
	}, [])

	// 強制更新関数
	const forceUpdate = useCallback(() => {
		const result = calculateCharCount(currentText)
		setCharCountResult(result)
		lastCalculatedTextRef.current = currentText
	}, [currentText, calculateCharCount])

	return {
		currentText,
		characterCount: charCountResult.characterCount,
		lineCount: charCountResult.lineCount,
		pageCount: charCountResult.pageCount,
		updateText,
		clearCache,
		forceUpdate,
		// デバッグ用
		cacheSize: cacheRef.current.size,
		isCalculating: currentText !== lastCalculatedTextRef.current,
	}
}
