import { useState, useCallback, useMemo, useEffect, useRef } from 'react'
import { calculateCharCount } from '../../domain/text/calculateCharCount'
import { DEFAULT_TEXT } from '../../domain/entities/defaultSetting'

export function useCharCount() {
	const [currentNotSavedText, setCurrentNotSavedText] = useState(DEFAULT_TEXT)
	const charCountTimeoutRef = useRef<NodeJS.Timeout>()

	// 初期化時にデフォルトテキストを確実に設定
	useEffect(() => {
		if (!currentNotSavedText) {
			setCurrentNotSavedText(DEFAULT_TEXT)
		}
	}, [currentNotSavedText])

	const charCount = useMemo(() => {
		// デバウンス処理でパフォーマンスを最適化
		if (charCountTimeoutRef.current) {
			clearTimeout(charCountTimeoutRef.current)
		}

		return new Promise<number>(resolve => {
			charCountTimeoutRef.current = setTimeout(() => {
				const result = calculateCharCount(currentNotSavedText).characterCount
				resolve(result)
			}, 100) // 100msのデバウンス
		})
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
