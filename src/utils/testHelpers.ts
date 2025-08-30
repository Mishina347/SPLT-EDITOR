/**
 * テスト用のヘルパー関数とモック
 *
 * 注意: このファイルはJest環境でのみ使用されることを想定しています。
 * Jest関連の型定義が必要な場合は、@types/jestをインストールしてください。
 */

import { TextSnapshot, LayoutConfig, EditorSettings } from '../domain'
import { FontFamily } from '../domain'

/**
 * テスト用のファクトリー関数
 */

export const createMockTextSnapshot = (overrides: Partial<TextSnapshot> = {}): TextSnapshot => {
	return {
		id: 'test-snapshot-1',
		content: 'テストコンテンツ',
		timestamp: new Date('2023-01-01T00:00:00Z'),
		description: 'テスト説明',
		...overrides,
	}
}

export const createMockLayoutConfig = (overrides: Partial<LayoutConfig> = {}): LayoutConfig => {
	return {
		charsPerLine: 40,
		linesPerPage: 20,
		fontSize: 14,
		fontFamily: 'UD Digi Kyokasho N-R' as FontFamily,
		...overrides,
	}
}

export const createMockEditorSettings = (
	overrides: Partial<EditorSettings> = {}
): EditorSettings => {
	return {
		fontSize: 14,
		wordWrapColumn: 80,
		fontFamily: 'UD Digi Kyokasho N-R' as FontFamily,
		backgroundColor: '#ffffff',
		textColor: '#000000',
		theme: {
			background: '#ffffff',
			foreground: '#000000',
			keyword: '#0000ff',
			string: '#008000',
			comment: '#808080',
		},
		autoSave: {
			enabled: true,
			delay: 1000,
		},
		...overrides,
	}
}

/**
 * DOM要素のモック
 */
export const createMockElement = (overrides: Partial<HTMLElement> = {}): HTMLElement => {
	const element = document.createElement('div')
	Object.assign(element, overrides)
	return element
}

export const createMockRect = (overrides: Partial<DOMRect> = {}): DOMRect => {
	return {
		x: 0,
		y: 0,
		width: 100,
		height: 100,
		top: 0,
		right: 100,
		bottom: 100,
		left: 0,
		toJSON: () => ({}),
		...overrides,
	}
}

/**
 * イベントのモック
 */
export const createMockMouseEvent = (overrides: Partial<MouseEvent> = {}): MouseEvent => {
	return new MouseEvent('click', {
		clientX: 50,
		clientY: 50,
		...overrides,
	})
}

export const createMockTouchEvent = (overrides: Partial<TouchEvent> = {}): TouchEvent => {
	const touch = new Touch({
		identifier: 1,
		target: document.createElement('div'),
		clientX: 50,
		clientY: 50,
	})
	// TouchListの適切なモックを作成
	const createTouchList = (touches: Touch[]): TouchList => {
		const touchList = Object.create(TouchList.prototype)
		Object.assign(touchList, touches)
		touchList.length = touches.length
		touchList.item = (index: number) => touches[index] || null
		return touchList
	}

	const touchList = createTouchList([touch])

	return new TouchEvent('touchstart', {
		touches: touchList,
		changedTouches: touchList,
		...overrides,
	})
}

export const createMockKeyboardEvent = (
	key: string,
	overrides: Partial<KeyboardEvent> = {}
): KeyboardEvent => {
	return new KeyboardEvent('keydown', {
		key,
		code: `Key${key.toUpperCase()}`,
		...overrides,
	})
}

/**
 * 非同期処理のテストヘルパー
 */
export const waitFor = (ms: number): Promise<void> => {
	return new Promise(resolve => setTimeout(resolve, ms))
}

export const waitForNextTick = (): Promise<void> => {
	return new Promise(resolve => setTimeout(resolve, 0))
}

/**
 * ローカルストレージのモック
 */
export const createMockLocalStorage = (): Storage => {
	const store: Record<string, string> = {}

	return {
		getItem: jest.fn((key: string) => store[key] || null),
		setItem: jest.fn((key: string, value: string) => {
			store[key] = value
		}),
		removeItem: jest.fn((key: string) => {
			delete store[key]
		}),
		clear: jest.fn(() => {
			Object.keys(store).forEach(key => delete store[key])
		}),
		key: jest.fn((index: number) => {
			const keys = Object.keys(store)
			return keys[index] || null
		}),
		get length() {
			return Object.keys(store).length
		},
	}
}

/**
 * コンソールメソッドのモック（テスト中のログ出力を抑制）
 */
export const mockConsole = () => {
	const originalConsole = { ...console }

	beforeEach(() => {
		jest.spyOn(console, 'log').mockImplementation(() => {})
		jest.spyOn(console, 'warn').mockImplementation(() => {})
		jest.spyOn(console, 'error').mockImplementation(() => {})
	})

	afterEach(() => {
		jest.restoreAllMocks()
	})

	return originalConsole
}

/**
 * ResizeObserverのモック
 */
export const createMockResizeObserver = () => {
	return jest.fn().mockImplementation(() => ({
		observe: jest.fn(),
		unobserve: jest.fn(),
		disconnect: jest.fn(),
	}))
}

/**
 * IntersectionObserverのモック
 */
export const createMockIntersectionObserver = () => {
	return jest.fn().mockImplementation(() => ({
		observe: jest.fn(),
		unobserve: jest.fn(),
		disconnect: jest.fn(),
	}))
}

/**
 * ファイルAPIのモック
 */
export const createMockFile = (
	name: string = 'test.txt',
	content: string = 'test content',
	type: string = 'text/plain'
): File => {
	const blob = new Blob([content], { type })
	return new File([blob], name, { type })
}

/**
 * メディアクエリのモック
 */
export const createMockMediaQuery = (matches: boolean = false) => {
	return jest.fn().mockImplementation(() => ({
		matches,
		addEventListener: jest.fn(),
		removeEventListener: jest.fn(),
	}))
}
