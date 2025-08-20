/** @type {import('jest').Config} */
module.exports = {
	preset: 'ts-jest',
	testEnvironment: 'jsdom',
	roots: ['<rootDir>/src'],
	testMatch: ['**/__tests__/**/*.{js,jsx,ts,tsx}', '**/*.(test|spec).{js,jsx,ts,tsx}'],
	transform: {
		'^.+\\.(ts|tsx)$': [
			'ts-jest',
			{
				tsconfig: {
					jsx: 'react-jsx',
				},
			},
		],
	},
	moduleFileExtensions: ['ts', 'tsx', 'js', 'jsx', 'json', 'node'],
	moduleNameMapping: {
		'^@/(.*)$': '<rootDir>/src/$1',
		'\\.(css|less|scss|sass)$': 'identity-obj-proxy',
		'\\.(gif|ttf|eot|svg|png)$': 'jest-transform-stub',
	},
	setupFilesAfterEnv: ['<rootDir>/src/setupTests.ts'],
	collectCoverageFrom: [
		'src/**/*.{ts,tsx}',
		'!src/**/*.d.ts',
		'!src/main.tsx',
		'!src/vite-env.d.ts',
		'!**/*.stories.{js,jsx,ts,tsx}',
		'!src/utils/testHelpers.ts',
		'!src/domain/entities/defaultSetting.ts',
		'!src/infra/settingLoader/settingsRepository.tauri.ts',
		'!src/presentation/hooks/useDraggableResize.ts',
		'!src/__tests__/**/*',
	],
	coverageDirectory: 'coverage',
	coverageReporters: ['text', 'lcov', 'html'],
	testTimeout: 10000,
	transformIgnorePatterns: ['node_modules/(?!(monaco-editor)/)'],
}
