import React, { ReactNode, useEffect, useRef } from 'react'
import { createPortal } from 'react-dom'
import styles from './Dialog.module.css'
import { Z_INDEX_DIALOG } from './zIndex'

interface DialogProps {
	isOpen: boolean
	onClose: () => void
	title: string
	children: ReactNode
	maxWidth?: number | string
	maxHeight?: number | string
	width?: number | string
	height?: number | string
	constrainToContainer?: boolean
}

export const Dialog: React.FC<DialogProps> = ({
	isOpen,
	onClose,
	title,
	children,
	maxWidth,
	maxHeight,
	width,
	height,
	constrainToContainer = false,
}) => {
	const modalRef = useRef<HTMLDivElement>(null)
	const firstFocusableElementRef = useRef<HTMLElement | null>(null)
	const lastFocusableElementRef = useRef<HTMLElement | null>(null)

	// フォーカストラップ機能とz-index管理
	useEffect(() => {
		if (!isOpen || !modalRef.current) return

		// モーダル内の最初のフォーカス可能な要素にフォーカス
		const focusableElements = modalRef.current.querySelectorAll<HTMLElement>(
			'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
		)

		if (focusableElements.length > 0) {
			firstFocusableElementRef.current = focusableElements[0]
			lastFocusableElementRef.current = focusableElements[focusableElements.length - 1]
			firstFocusableElementRef.current.focus()
		}

		// Escapeキーでモーダルを閉じる
		const handleEscape = (e: KeyboardEvent) => {
			if (e.key === 'Escape') {
				onClose()
			}
		}

		// Tabキーでフォーカストラップ
		const handleTab = (e: KeyboardEvent) => {
			if (e.key === 'Tab') {
				if (e.shiftKey) {
					// Shift+Tab: 前の要素
					if (document.activeElement === firstFocusableElementRef.current) {
						e.preventDefault()
						lastFocusableElementRef.current?.focus()
					}
				} else {
					// Tab: 次の要素
					if (document.activeElement === lastFocusableElementRef.current) {
						e.preventDefault()
						firstFocusableElementRef.current?.focus()
					}
				}
			}
		}

		document.addEventListener('keydown', handleEscape)
		document.addEventListener('keydown', handleTab)

		// スクロールを無効化
		document.body.style.overflow = 'hidden'

		// モーダルが開いている間、他の要素のz-indexを一時的に下げる
		const elementsToLower = document.querySelectorAll<HTMLElement>('[style*="z-index"]')
		const originalZIndexes = new Map<HTMLElement, string>()

		elementsToLower.forEach(element => {
			const style = element.style
			if (style.zIndex && parseInt(style.zIndex) > 100) {
				originalZIndexes.set(element, style.zIndex)
				style.zIndex = '1'
			}
		})

		return () => {
			document.removeEventListener('keydown', handleEscape)
			document.removeEventListener('keydown', handleTab)
			document.body.style.overflow = 'unset'

			// 元のz-indexを復元
			originalZIndexes.forEach((zIndex, element) => {
				element.style.zIndex = zIndex
			})
		}
	}, [isOpen, onClose])

	if (!isOpen) return null

	// サイズ調整の計算
	const getResponsiveSize = () => {
		const viewportWidth = window.innerWidth

		// デフォルトサイズ
		let dialogWidth = width || '90vw'
		let dialogHeight = height || '90vh'
		let dialogMaxWidth = maxWidth || '1200px'
		let dialogMaxHeight = maxHeight || '800px'

		// コンテナ制約がある場合の調整
		if (constrainToContainer) {
			// より小さなサイズに調整
			dialogWidth = width || '85%'
			dialogHeight = height || '85%'
			dialogMaxWidth = maxWidth || '800px'
			dialogMaxHeight = maxHeight || '600px'
		}

		// モバイル端末の場合の調整
		if (viewportWidth <= 768) {
			dialogWidth = width || '95vw'
			dialogHeight = height || '85vh'
			dialogMaxWidth = maxWidth || '95vw'
			dialogMaxHeight = maxHeight || '85vh'
		}

		return {
			width: dialogWidth,
			height: dialogHeight,
			maxWidth: dialogMaxWidth,
			maxHeight: dialogMaxHeight,
		}
	}

	const responsiveSize = getResponsiveSize()

	const portalTarget = constrainToContainer
		? document.body // コンテナ制約がある場合でも、portalは全画面表示
		: document.body

	return createPortal(
		<div
			className={styles.dialogOverlay}
			onClick={onClose}
			style={{
				touchAction: 'none', // ダイアログ外でのスクロールを防ぐ
			}}
		>
			<div
				ref={modalRef}
				className={`${styles.dialogContent} ${constrainToContainer ? styles.constrained : ''}`}
				onClick={e => e.stopPropagation()}
				style={{
					touchAction: 'manipulation', // ダイアログ内でのタッチ操作は有効
					width: responsiveSize.width,
					height: responsiveSize.height,
					maxWidth: responsiveSize.maxWidth,
					maxHeight: responsiveSize.maxHeight,
				}}
			>
				<div className={styles.dialogHeader}>
					<h3>{title}</h3>
					<button
						className={styles.dialogCloseButton}
						onClick={onClose}
						onTouchEnd={e => {
							// モバイルでの閉じるボタンも確実に動作させる
							e.preventDefault()
							onClose()
						}}
						aria-label="閉じる"
						style={{
							touchAction: 'manipulation',
							WebkitTapHighlightColor: 'rgba(0,0,0,0)',
						}}
					>
						{'×'}
					</button>
				</div>
				<div className={styles.dialogBody}>{children}</div>
			</div>
		</div>,
		portalTarget
	)
}
