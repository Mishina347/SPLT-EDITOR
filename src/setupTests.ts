import '@testing-library/jest-dom'

// Monaco Editor のモック
Object.defineProperty(window, 'monaco', {
	value: {
		editor: {
			create: jest.fn(),
			defineTheme: jest.fn(),
			setTheme: jest.fn(),
		},
		languages: {
			typescript: {
				javascriptDefaults: {
					setCompilerOptions: jest.fn(),
				},
			},
		},
	},
	writable: true,
})

// ResizeObserver のモック
global.ResizeObserver = jest.fn().mockImplementation(() => ({
	observe: jest.fn(),
	unobserve: jest.fn(),
	disconnect: jest.fn(),
}))

// IntersectionObserver のモック
global.IntersectionObserver = jest.fn().mockImplementation(() => ({
	observe: jest.fn(),
	unobserve: jest.fn(),
	disconnect: jest.fn(),
}))

// window.matchMedia のモック
Object.defineProperty(window, 'matchMedia', {
	writable: true,
	value: jest.fn().mockImplementation(query => ({
		matches: false,
		media: query,
		onchange: null,
		addListener: jest.fn(), // deprecated
		removeListener: jest.fn(), // deprecated
		addEventListener: jest.fn(),
		removeEventListener: jest.fn(),
		dispatchEvent: jest.fn(),
	})),
})

// getComputedStyle のモック
Object.defineProperty(window, 'getComputedStyle', {
	value: () => ({
		getPropertyValue: () => '',
	}),
})

// CSS モジュールのモック設定は jest.config.js の moduleNameMapping で行う
