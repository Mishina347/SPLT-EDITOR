import { useCallback, useEffect } from 'react'
import { logger } from '@/utils/logger'
import { eventBus, EVENTS } from '@/application/observers/EventBus'
import { isMobile, isMobileSize, isTauri } from '@/utils'

interface UseEventHandlersParams {
	currentNotSavedText: string
	lastSavedText: string
	isSaving: boolean
	forceSave: () => Promise<void>
	setCurrentSavedText: (text: string) => void
	setIsDraggableMode: (draggable: boolean) => void
	setPendingAction: (action: (() => void) | null) => void
	setShowSaveConfirm: (show: boolean) => void
	saveSnapshot: (content: string, description: string) => void
}

export const useEventHandlers = ({
	currentNotSavedText,
	lastSavedText,
	isSaving,
	forceSave,
	setCurrentSavedText,
	setIsDraggableMode,
	setPendingAction,
	setShowSaveConfirm,
	saveSnapshot,
}: UseEventHandlersParams) => {
	// ブラウザのページ離脱前の保存確認（beforeunload）
	useEffect(() => {
		if (isTauri()) return // Tauri環境では不要
		const handleBeforeUnload = (e: BeforeUnloadEvent) => {
			const hasUnsavedChanges = currentNotSavedText !== lastSavedText
			if (hasUnsavedChanges) {
				e.preventDefault()
				e.returnValue = ''
				return ''
			}
		}

		window.addEventListener('beforeunload', handleBeforeUnload)
		return () => {
			window.removeEventListener('beforeunload', handleBeforeUnload)
		}
	}, [currentNotSavedText, lastSavedText])

	// ブラウザ環境でのページ更新/タブ閉じる前のカスタム保存確認
	useEffect(() => {
		if (isTauri()) return // Tauri環境では不要

		const handleKeyDown = (e: KeyboardEvent) => {
			// F5キーまたはCtrl+R/Cmd+Rでページ更新
			if (e.key === 'F5' || ((e.ctrlKey || e.metaKey) && e.key === 'r')) {
				const hasUnsavedChanges = currentNotSavedText !== lastSavedText
				if (hasUnsavedChanges) {
					e.preventDefault()
					setPendingAction(() => {
						window.location.reload()
					})
					setShowSaveConfirm(true)
				}
			}
		}

		window.addEventListener('keydown', handleKeyDown)
		return () => {
			window.removeEventListener('keydown', handleKeyDown)
		}
	}, [currentNotSavedText, lastSavedText, setPendingAction, setShowSaveConfirm])

	// スマホサイズの場合はドラッグ可能モードを無効化
	useEffect(() => {
		const handleResize = () => {
			if (isMobileSize()) {
				setIsDraggableMode(false)
			}
		}

		// 初期チェック
		handleResize()

		// リサイズイベントリスナーを追加
		window.addEventListener('resize', handleResize)

		return () => {
			window.removeEventListener('resize', handleResize)
		}
	}, [setIsDraggableMode])

	// 手動保存機能（Cmd+S / Ctrl+S）
	useEffect(() => {
		const handleKeyDown = async (e: KeyboardEvent) => {
			if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 's') {
				e.preventDefault()

				// 既に保存処理中の場合は何もしない
				if (isSaving) {
					return
				}

				try {
					logger.info('useEventHandlers', 'Manual save triggered with content', currentNotSavedText)

					// forceSaveを使用してauto saveタイマーをリセット＆即座に保存
					await forceSave()

					// 手動保存成功時に状態を更新（空文字でも更新）
					setCurrentSavedText(currentNotSavedText)

					// イベントバスで保存完了を通知
					eventBus.publish(EVENTS.TEXT_SAVED, {
						timestamp: Date.now(),
						contentLength: currentNotSavedText.length,
					})

					// 手動保存時のスナップショットを追加（空文字でも記録）
					saveSnapshot(currentNotSavedText, `手動保存 - ${new Date().toLocaleString('ja-JP')}`)

					logger.info('useEventHandlers', 'Manual save completed successfully')
				} catch (error) {
					logger.error('useEventHandlers', 'Manual save failed', error)
					eventBus.publish(EVENTS.ERROR_OCCURRED, {
						error: error instanceof Error ? error.message : String(error),
						operation: 'manual_save',
					})
				}
			}
		}
		window.addEventListener('keydown', handleKeyDown)

		return () => window.removeEventListener('keydown', handleKeyDown)
	}, [currentNotSavedText, saveSnapshot, forceSave, isSaving, setCurrentSavedText])

	// Tauri: ウィンドウ終了前の保存確認（close-requested）
	useEffect(() => {
		if (!isTauri()) {
			return
		}

		let unlisten: (() => void) | null = null

		;(async () => {
			try {
				const { getCurrentWindow } = await import('@tauri-apps/api/window')
				const appWindow = getCurrentWindow()
				unlisten = await appWindow.listen('close-requested', async () => {
					console.log('useEventHandlers: Tauri close-requested event triggered')

					const currentText = currentNotSavedText
					const lastText = lastSavedText
					const hasUnsaved = currentText !== lastText
					if (hasUnsaved) {
						logger.debug('useEventHandlers', 'Has unsaved changes, showing save confirmation')
						setPendingAction(async () => {
							try {
								logger.debug('useEventHandlers', 'INTO')
								setShowSaveConfirm(true)
							} catch (error) {
								console.error('useEventHandlers: Failed to invoke allowClose:', error)
							}
						})
					}
				})
			} catch (err) {}
		})()

		return () => {
			if (unlisten) {
				unlisten()
			}
		}
	}, [currentNotSavedText, lastSavedText, setPendingAction, setShowSaveConfirm])

	// mobileでのみ最新の書き込みをcurrentSaveTextに常に保存
	// PCでは通常の自動保存機能を使用し、mobileではリアルタイムでcurrentSaveTextを更新
	useEffect(() => {
		if (isMobile() && currentNotSavedText !== '') {
			// mobileの場合、テキストが変更されるたびにcurrentSaveTextを更新
			// デバウンス処理でパフォーマンスを最適化
			const timeoutId = setTimeout(() => {
				logger.info('useEventHandlers', 'Mobile auto-save: updating currentSaveText')
				setCurrentSavedText(currentNotSavedText)
			}, 300) // 300msのデバウンス

			return () => clearTimeout(timeoutId)
		}
	}, [currentNotSavedText, setCurrentSavedText])

	return {}
}
