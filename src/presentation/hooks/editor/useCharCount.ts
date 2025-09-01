import { useState, useCallback, useMemo, useEffect, useRef } from 'react'
import { calculateCharCount } from '@/domain/text/calculateCharCount'

export function useCharCount() {
	const [currentNotSavedText, setCurrentNotSavedText] = useState('')
	const charCountTimeoutRef = useRef<NodeJS.Timeout>()

	// 初期化時にデフォルトテキストを確実に設定
	useEffect(() => {
		if (!currentNotSavedText) {
			setCurrentNotSavedText('')
		}
	}, [currentNotSavedText])

	const charCount = useMemo(() => {
		// デバウンス処理でパフォーマンスを最適化
		if (charCountTimeoutRef.current) {
			clearTimeout(charCountTimeoutRef.current)
		}

		// 即座に計算結果を返す（非同期処理なし）
		return calculateCharCount(currentNotSavedText).characterCount
	}, [currentNotSavedText])

	// クリーンアップ
	useEffect(() => {
		return () => {
			if (charCountTimeoutRef.current) {
				clearTimeout(charCountTimeoutRef.current)
			}
		}
	}, [])

	const updateText = useCallback((text: string) => {
		setCurrentNotSavedText(text)
	}, [])

	return {
		currentNotSavedText,
		charCount,
		updateText,
	}
}
