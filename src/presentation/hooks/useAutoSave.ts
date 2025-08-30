import { useCallback, useEffect, useRef, useState } from 'react'
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
	const [isSaving, setIsSaving] = useState<boolean>(false)

	// auto save を実行する関数
	const performAutoSave = useCallback(
		async (textContent: string, isManualSave: boolean = false) => {
			// 保存中かどうかをチェック
			if (isSavingRef.current) {
				return
			}

			// 手動保存の場合は内容が同じでも保存を実行
			if (!isManualSave && textContent === lastSavedContentRef.current) {
				console.log('[DEBUG] Auto-save skipped: content unchanged')
				return
			}

			try {
				isSavingRef.current = true
				setIsSaving(true)

				await saveText(fileName, textContent)
				lastSavedContentRef.current = textContent

				console.log(`[DEBUG] ${isManualSave ? 'Manual' : 'Auto'}-save completed successfully`)

				// 手動保存の場合はonSaveコールバックを呼び出さない
				// （呼び出し元で個別にスナップショットを作成するため）
				if (!isManualSave) {
					onSave?.(textContent)
				} else {
					console.log(`[DEBUG] Manual save: skipping onSave callback`)
				}
			} catch (error) {
				console.error(isManualSave ? 'Manual save failed:' : 'Auto save failed:', error)
			} finally {
				isSavingRef.current = false
				setIsSaving(false)
			}
		},
		[fileName, onSave]
	)

	// コンテンツ変更時にタイマーをリセット
	useEffect(() => {
		console.log(
			`[DEBUG] useEffect triggered - enabled: ${enabled}, contentLength: ${content.length}, isSaving: ${isSavingRef.current}, contentChanged: ${content !== lastSavedContentRef.current}`
		)

		// 自動保存が無効、保存中、または内容が変更されていない場合はタイマー設定をスキップ
		if (!enabled || isSavingRef.current) {
			console.log(
				`[DEBUG] Skipping timer setup - enabled: ${enabled}, isSaving: ${isSavingRef.current}`
			)
			return
		}

		// 内容が変更されていない場合は自動保存タイマーをスキップ
		if (content === lastSavedContentRef.current) {
			console.log(
				`[DEBUG] Skipping auto-save timer setup - content unchanged: "${content}" === "${lastSavedContentRef.current}"`
			)
			return
		}

		// 既存のタイマーをクリア
		if (timeoutRef.current) {
			console.log(`[DEBUG] Clearing existing timer`)
			clearTimeout(timeoutRef.current)
			timeoutRef.current = null
		}

		// 新しいタイマーを設定
		console.log(`[DEBUG] Setting new auto-save timer for ${delay} minutes`)
		timeoutRef.current = setTimeout(
			() => {
				console.log(`[DEBUG] Auto-save timer fired`)
				performAutoSave(content, false)
			},
			delay * 60 * 1000
		)

		// クリーンアップ
		return () => {
			if (timeoutRef.current) {
				console.log(`[DEBUG] Cleanup: clearing timer`)
				clearTimeout(timeoutRef.current)
				timeoutRef.current = null
			}
		}
	}, [content, enabled, delay, performAutoSave])

	// 手動保存（即座に実行）
	const forceSave = useCallback(async () => {
		console.log(`[DEBUG] forceSave called with content: "${content}"`)

		// 既存のタイマーをクリア（自動保存を停止）
		if (timeoutRef.current) {
			console.log(`[DEBUG] Clearing existing auto-save timer`)
			clearTimeout(timeoutRef.current)
			timeoutRef.current = null
		} else {
			console.log(`[DEBUG] No existing timer to clear`)
		}

		// 手動保存として実行（内容が同じでも保存）
		await performAutoSave(content, true)
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
		isSaving,
		lastSavedContent: lastSavedContentRef.current,
	}
}
