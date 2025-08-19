import { useCallback, useEffect, useRef } from 'react'
import { saveText } from '../../usecases/file/saveText'

interface UseAutoSaveOptions {
	enabled: boolean
	delay: number // 自動保存までの遅延時間（ミリ秒）
	fileName: string
	onSave?: (content: string) => void // 保存時のコールバック
}

export function useAutoSave(content: string, options: UseAutoSaveOptions) {
	const { enabled, delay, fileName, onSave } = options
	const timeoutRef = useRef<NodeJS.Timeout | null>(null)
	const lastSavedContentRef = useRef<string>('')
	const isSavingRef = useRef<boolean>(false)

	// auto save を実行する関数
	const performAutoSave = useCallback(
		async (textContent: string) => {
			if (isSavingRef.current || textContent === lastSavedContentRef.current) {
				return
			}

			try {
				isSavingRef.current = true
				await saveText(fileName, textContent)
				lastSavedContentRef.current = textContent
				onSave?.(textContent)
			} catch (error) {
				console.error('Auto save failed:', error)
			} finally {
				isSavingRef.current = false
			}
		},
		[fileName, onSave]
	)

	// コンテンツ変更時にタイマーをリセット
	useEffect(() => {
		if (!enabled || content === lastSavedContentRef.current) {
			return
		}

		// 既存のタイマーをクリア
		if (timeoutRef.current) {
			clearTimeout(timeoutRef.current)
		}

		// 新しいタイマーを設定
		timeoutRef.current = setTimeout(
			() => {
				performAutoSave(content)
			},
			delay * 60 * 1000
		)

		// クリーンアップ
		return () => {
			if (timeoutRef.current) {
				clearTimeout(timeoutRef.current)
				timeoutRef.current = null
			}
		}
	}, [content, enabled, delay, performAutoSave])

	// 手動保存（即座に実行）
	const forceSave = useCallback(async () => {
		if (timeoutRef.current) {
			clearTimeout(timeoutRef.current)
			timeoutRef.current = null
		}
		await performAutoSave(content)
	}, [content, performAutoSave])

	// コンポーネント アンマウント時のクリーンアップ
	useEffect(() => {
		return () => {
			if (timeoutRef.current) {
				clearTimeout(timeoutRef.current)
			}
		}
	}, [])

	return {
		forceSave,
		isSaving: isSavingRef.current,
		lastSavedContent: lastSavedContentRef.current,
	}
}
