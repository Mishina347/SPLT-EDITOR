import { useEffect, useRef } from 'react'

export const useFocusTrap = (isActive: boolean) => {
	const containerRef = useRef<HTMLDivElement>(null)

	useEffect(() => {
		if (!isActive || !containerRef.current) return

		const container = containerRef.current

		const handleKeyDown = (e: KeyboardEvent) => {
			if (e.key !== 'Tab') return

			const focusableElements = container.querySelectorAll<HTMLElement>(
				'a, button, input, textarea, select, [tabindex]:not([tabindex="-1"])'
			)

			if (focusableElements.length === 0) return

			const firstElement = focusableElements[0]
			const lastElement = focusableElements[focusableElements.length - 1]

			if (e.shiftKey) {
				// Shift + Tab: 前の要素に移動
				if (document.activeElement === firstElement) {
					e.preventDefault()
					lastElement.focus()
				}
			} else {
				// Tab: 次の要素に移動
				if (document.activeElement === lastElement) {
					e.preventDefault()
					firstElement.focus()
				}
			}
		}

		container.addEventListener('keydown', handleKeyDown)

		// 初期フォーカスを設定
		const firstFocusableElement = container.querySelector<HTMLElement>(
			'a, button, input, textarea, select, [tabindex]:not([tabindex="-1"])'
		)
		if (firstFocusableElement) {
			firstFocusableElement.focus()
		}

		return () => {
			container.removeEventListener('keydown', handleKeyDown)
		}
	}, [isActive])

	return containerRef
}
