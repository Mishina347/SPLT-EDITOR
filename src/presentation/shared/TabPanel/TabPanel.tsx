import React, { useCallback, useEffect, useRef, useState } from 'react'
import styles from './TabPanel.module.css'

export interface TabItem {
	id: string
	label: string
	ariaLabel?: string
	disabled?: boolean
}

interface TabPanelProps {
	tabs: TabItem[]
	activeTabId: string
	onTabChange: (tabId: string) => void
	children: React.ReactNode
	className?: string
	orientation?: 'horizontal' | 'vertical'
	isTransparent?: boolean
	customTabStyles?: {
		tabList?: React.CSSProperties
		tab?: React.CSSProperties
		activeTab?: React.CSSProperties
		tabPanel?: React.CSSProperties
		activeTabBorderColor?: string
	}
}

export const TabPanel: React.FC<TabPanelProps> = ({
	tabs,
	activeTabId,
	onTabChange,
	children,
	className = '',
	orientation = 'horizontal',
	isTransparent = false,
	customTabStyles,
}) => {
	const tabListRef = useRef<HTMLDivElement>(null)
	const tabRefs = useRef<Map<string, HTMLButtonElement>>(new Map())
	const [focusedTabId, setFocusedTabId] = useState<string>(activeTabId)

	// タブのref管理
	const setTabRef = useCallback((id: string, element: HTMLButtonElement | null) => {
		if (element) {
			tabRefs.current.set(id, element)
		} else {
			tabRefs.current.delete(id)
		}
	}, [])

	// キーボードナビゲーション
	const handleKeyDown = useCallback(
		(event: React.KeyboardEvent, tabId: string) => {
			const tabIds = tabs.filter(tab => !tab.disabled).map(tab => tab.id)
			const currentIndex = tabIds.indexOf(tabId)
			let nextIndex: number

			switch (event.key) {
				case 'ArrowRight':
				case 'ArrowDown':
					event.preventDefault()
					nextIndex =
						orientation === 'horizontal'
							? (currentIndex + 1) % tabIds.length
							: (currentIndex + 1) % tabIds.length
					break
				case 'ArrowLeft':
				case 'ArrowUp':
					event.preventDefault()
					nextIndex =
						orientation === 'horizontal'
							? (currentIndex - 1 + tabIds.length) % tabIds.length
							: (currentIndex - 1 + tabIds.length) % tabIds.length
					break
				case 'Home':
					event.preventDefault()
					nextIndex = 0
					break
				case 'End':
					event.preventDefault()
					nextIndex = tabIds.length - 1
					break
				case 'Enter':
				case ' ':
					event.preventDefault()
					onTabChange(tabId)
					return
				default:
					return
			}

			const nextTabId = tabIds[nextIndex]
			setFocusedTabId(nextTabId)
			tabRefs.current.get(nextTabId)?.focus()
		},
		[tabs, orientation, onTabChange]
	)

	// アクティブタブが変更されたときにフォーカスも更新
	useEffect(() => {
		setFocusedTabId(activeTabId)
	}, [activeTabId])

	return (
		<div className={`${styles.tabContainer} ${isTransparent ? styles.transparent : ''} ${className}`}>
			{/* タブリスト */}
			<div
				ref={tabListRef}
				className={`${styles.tabList} ${styles[orientation]} ${isTransparent ? styles.transparentTabList : ''}`}
				role="tablist"
				aria-orientation={orientation}
				style={customTabStyles?.tabList}
			>
				{tabs.map(tab => (
					<button
						key={tab.id}
						ref={el => setTabRef(tab.id, el)}
						className={`${styles.tab} ${
							activeTabId === tab.id ? styles.active : styles.inactive
						} ${tab.disabled ? styles.disabled : ''}`}
						role="tab"
						aria-selected={activeTabId === tab.id}
						aria-controls={`tabpanel-${tab.id}`}
						aria-label={tab.ariaLabel || tab.label}
						tabIndex={focusedTabId === tab.id ? 0 : -1}
						disabled={tab.disabled}
						onClick={() => !tab.disabled && onTabChange(tab.id)}
						onKeyDown={event => handleKeyDown(event, tab.id)}
						style={{
							...customTabStyles?.tab,
							...(activeTabId === tab.id ? customTabStyles?.activeTab : {}),
							...(customTabStyles?.activeTabBorderColor
								? {
										'--active-tab-border-color': customTabStyles.activeTabBorderColor,
									}
								: {}),
						}}
					>
						{tab.label}
					</button>
				))}
			</div>

			{/* タブパネル */}
			<div
				className={styles.tabPanel}
				role="tabpanel"
				id={`tabpanel-${activeTabId}`}
				aria-labelledby={`tab-${activeTabId}`}
				style={customTabStyles?.tabPanel}
			>
				{children}
			</div>
		</div>
	)
}
