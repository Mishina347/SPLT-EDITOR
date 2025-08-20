import { useCallback, useEffect, useRef, useState } from 'react'

interface UseResizableOptions {
	initialSize?: number // 初期サイズ（%）
	minSize?: number // 最小サイズ（%）
	maxSize?: number // 最大サイズ（%）
	onResize?: (size: number) => void
	step?: number // キーボード操作時のステップ（%）
	label?: string // アクセシビリティ用ラベル
}

export const useResizable = (options: UseResizableOptions = {}) => {
	const {
		initialSize = 50,
		minSize = 20,
		maxSize = 80,
		onResize,
		step = 5,
		label = 'パネルサイズ調整',
	} = options

	const [size, setSize] = useState(initialSize)
	const [isDragging, setIsDragging] = useState(false)
	const [isKeyboardMode, setIsKeyboardMode] = useState(false)
	const [announceText, setAnnounceText] = useState('')

	const containerRef = useRef<HTMLDivElement>(null)
	const resizerRef = useRef<HTMLDivElement>(null)
	const announceTimeoutRef = useRef<NodeJS.Timeout | null>(null)
	const lastAnnounceTimeRef = useRef<number>(0)

	// デバウンス付きアナウンス関数
	const announceWithDebounce = useCallback((message: string, force: boolean = false) => {
		const now = Date.now()

		// 最後のアナウンスから500ms未満の場合はデバウンス（強制フラグがない場合）
		if (!force && now - lastAnnounceTimeRef.current < 500) {
			if (announceTimeoutRef.current) {
				clearTimeout(announceTimeoutRef.current)
			}
			announceTimeoutRef.current = setTimeout(() => {
				setAnnounceText(message)
				lastAnnounceTimeRef.current = Date.now()
			}, 300)
		} else {
			setAnnounceText(message)
			lastAnnounceTimeRef.current = now
		}
	}, [])

	const updateSize = useCallback(
		(newSize: number, isFromDrag: boolean = false) => {
			const clampedSize = Math.max(minSize, Math.min(maxSize, newSize))
			setSize(clampedSize)
			onResize?.(clampedSize)

			// スクリーンリーダー向けアナウンス
			const editorPercent = Math.round(clampedSize)
			const previewPercent = Math.round(100 - clampedSize)
			const message = `エディタ ${editorPercent}%, プレビュー ${previewPercent}%`

			if (isFromDrag) {
				// ドラッグ中はデバウンス付きでアナウンス
				announceWithDebounce(message)
			} else {
				// キーボード操作は即座にアナウンス
				announceWithDebounce(message, true)
			}

			// MonacoEditorなどのコンポーネントにリサイズを通知
			// 少し遅延をつけてDOMの更新を待つ
			setTimeout(() => {
				window.dispatchEvent(new Event('resize'))
			}, 10)

			return clampedSize
		},
		[minSize, maxSize, onResize, announceWithDebounce]
	)

	const startResize = useCallback(
		(clientX: number) => {
			if (!containerRef.current) {
				return
			}

			const containerRect = containerRef.current.getBoundingClientRect()
			const percentage = ((clientX - containerRect.left) / containerRect.width) * 100
			updateSize(percentage, true) // ドラッグフラグをtrueで渡す
		},
		[updateSize]
	)

	// キーボードイベント
	const handleKeyDown = useCallback(
		(e: React.KeyboardEvent) => {
			let newSize = size
			let handled = true
			let actionDescription = ''

			switch (e.key) {
				case 'ArrowLeft':
				case 'ArrowDown':
					newSize = size - step
					setIsKeyboardMode(true)
					actionDescription = `${step}%縮小`
					break
				case 'ArrowRight':
				case 'ArrowUp':
					newSize = size + step
					setIsKeyboardMode(true)
					actionDescription = `${step}%拡大`
					break
				case 'Home':
					newSize = minSize
					setIsKeyboardMode(true)
					actionDescription = `最小サイズ(${minSize}%)に設定`
					break
				case 'End':
					newSize = maxSize
					setIsKeyboardMode(true)
					actionDescription = `最大サイズ(${maxSize}%)に設定`
					break
				case 'PageDown':
					newSize = size - step * 2
					setIsKeyboardMode(true)
					break
				case 'PageUp':
					newSize = size + step * 2
					setIsKeyboardMode(true)
					break
				case 'Enter':
				case ' ':
					// エンターまたはスペースでドラッグモード切り替え
					setIsKeyboardMode(!isKeyboardMode)
					setAnnounceText(
						isKeyboardMode ? 'キーボードモード終了' : 'キーボードモード: 矢印キーでサイズ調整'
					)
					break
				case 'Escape':
					setIsKeyboardMode(false)
					setAnnounceText('操作をキャンセルしました')
					resizerRef.current?.blur()
					break
				default:
					handled = false
			}

			if (handled) {
				e.preventDefault()
				e.stopPropagation()

				if (newSize !== size) {
					updateSize(newSize)
				}
			}
		},
		[size, step, minSize, maxSize, isKeyboardMode, updateSize]
	)

	// マウスイベント
	const handleMouseDown = useCallback((e: React.MouseEvent) => {
		e.preventDefault()
		setIsKeyboardMode(false)
		setIsDragging(true)
		setAnnounceText('ドラッグモード開始')
	}, [])

	// タッチイベント
	const handleTouchStart = useCallback((e: React.TouchEvent) => {
		setIsKeyboardMode(false)
		setIsDragging(true)
		setAnnounceText('ドラッグモード開始')
	}, [])

	// フォーカスイベント
	const handleFocus = useCallback(() => {
		setAnnounceText(`${label} リサイザー: 矢印キーまたはエンターキーで操作`)
	}, [label])

	const handleBlur = useCallback(() => {
		setIsKeyboardMode(false)
	}, [])

	// イベントリスナーの管理
	useEffect(() => {
		if (isDragging) {
			const currentMouseMove = (e: MouseEvent) => {
				startResize(e.clientX)
			}

			const currentMouseUp = () => {
				setIsDragging(false)
			}

			const currentTouchMove = (e: TouchEvent) => {
				if (e.touches[0]) {
					startResize(e.touches[0].clientX)
				}
			}

			const currentTouchEnd = () => {
				setIsDragging(false)
			}

			document.addEventListener('mousemove', currentMouseMove)
			document.addEventListener('mouseup', currentMouseUp)
			document.addEventListener('touchmove', currentTouchMove, { passive: false })
			document.addEventListener('touchend', currentTouchEnd)

			return () => {
				document.removeEventListener('mousemove', currentMouseMove)
				document.removeEventListener('mouseup', currentMouseUp)
				document.removeEventListener('touchmove', currentTouchMove)
				document.removeEventListener('touchend', currentTouchEnd)
			}
		}
	}, [isDragging, startResize])

	// アナウンステキストのクリア
	useEffect(() => {
		if (announceText) {
			const timer = setTimeout(() => {
				setAnnounceText('')
			}, 3000)
			return () => clearTimeout(timer)
		}
	}, [announceText])

	return {
		size,
		isDragging,
		isKeyboardMode,
		announceText,
		containerRef,
		resizerRef,
		resizerProps: {
			onMouseDown: handleMouseDown,
			onTouchStart: handleTouchStart,
			onKeyDown: handleKeyDown,
			onFocus: handleFocus,
			onBlur: handleBlur,
		},
		setSize: updateSize,
	}
}
