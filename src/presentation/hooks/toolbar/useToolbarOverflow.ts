import { useEffect, useState, useRef, useCallback } from 'react'

interface OverflowItem {
	id: string
	element: HTMLElement
	isVisible: boolean
}

interface UseToolbarOverflowOptions {
	container: HTMLElement | null
	items: HTMLElement[]
	threshold?: number // オーバーフローインジケーターのための余裕幅
}

export const useToolbarOverflow = ({
	container,
	items,
	threshold = 100,
}: UseToolbarOverflowOptions) => {
	const [overflowItems, setOverflowItems] = useState<OverflowItem[]>([])
	const [hasOverflow, setHasOverflow] = useState(false)
	const resizeObserverRef = useRef<ResizeObserver | null>(null)

	const checkOverflow = useCallback(() => {
		if (!container || items.length === 0) {
			setOverflowItems([])
			setHasOverflow(false)
			return
		}

		const containerRect = container.getBoundingClientRect()
		const containerWidth = containerRect.width - threshold // インジケーター分の余裕を確保

		// ハンバーガーメニューの幅を取得
		const hamburgerMenu = container.querySelector('.hamburgerContainer') as HTMLElement
		const hamburgerWidth = hamburgerMenu ? hamburgerMenu.getBoundingClientRect().width : 0

		let currentWidth = hamburgerWidth // ハンバーガーメニューの幅から開始
		const updatedItems: OverflowItem[] = []
		let hasOverflowDetected = false

		// 各アイテムの幅を累積して計算
		items.forEach((item, index) => {
			const itemRect = item.getBoundingClientRect()
			const itemWidth = itemRect.width

			// 左マージンやパディングを考慮
			const style = window.getComputedStyle(item)
			const marginLeft = parseFloat(style.marginLeft) || 0
			const marginRight = parseFloat(style.marginRight) || 0
			const totalItemWidth = itemWidth + marginLeft + marginRight

			const wouldFit = currentWidth + totalItemWidth <= containerWidth

			if (!wouldFit && !hasOverflowDetected) {
				hasOverflowDetected = true
			}

			const isVisible = wouldFit && !hasOverflowDetected

			// アイテムが表示される場合のみ幅を累積
			if (isVisible) {
				currentWidth += totalItemWidth
			}

			// 非表示になったアイテムの要素も非表示にする
			if (item.style) {
				item.style.display = isVisible ? '' : 'none'
			}

			updatedItems.push({
				id: `toolbar-item-${index}`,
				element: item,
				isVisible,
			})
		})

		setOverflowItems(updatedItems)
		setHasOverflow(hasOverflowDetected)
	}, [container, items, threshold])

	// ResizeObserverでコンテナサイズの変更を監視
	useEffect(() => {
		if (!container) return

		// 初回チェック
		checkOverflow()

		// ResizeObserverの設定
		resizeObserverRef.current = new ResizeObserver(() => {
			checkOverflow()
		})

		resizeObserverRef.current.observe(container)

		return () => {
			if (resizeObserverRef.current) {
				resizeObserverRef.current.disconnect()
			}
		}
	}, [container, checkOverflow])

	// アイテムの変更時にチェック
	useEffect(() => {
		checkOverflow()
	}, [items, checkOverflow])

	// 手動でのチェック関数を提供
	const recheck = useCallback(() => {
		checkOverflow()
	}, [checkOverflow])

	// 表示されているアイテムと隠れているアイテムを分離
	const visibleItems = overflowItems.filter(item => item.isVisible)
	const hiddenItems = overflowItems.filter(item => !item.isVisible)

	return {
		overflowItems,
		visibleItems,
		hiddenItems,
		hasOverflow,
		recheck,
	}
}
