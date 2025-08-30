// 基本的な型定義
export type LogLevel = 'debug' | 'info' | 'warn' | 'error'

// 位置・サイズ関連
export interface Position {
	x: number
	y: number
}

export interface Size {
	width: number
	height: number
}

// ページ情報
export interface PageInfo {
	currentPage: number
	totalPages: number
}

// スケール情報
export interface ScaleInfo {
	zoom: number
	transformScale: number
	totalScale: number
	viewportScale: number
}

// エラーハンドリング
export interface AppError {
	message: string
	code?: string
	details?: unknown
}

// 設定変更イベント
export interface SettingChangeEvent<T = unknown> {
	key: string
	value: T
	previousValue?: T
}

// ファイル操作
export interface FileInfo {
	name: string
	size: number
	type: string
	lastModified: number
}

// エクスポート設定
export interface ExportSettings {
	format: 'pdf' | 'docx' | 'txt'
	includeMetadata: boolean
	quality: 'low' | 'medium' | 'high'
}

// テーマ設定
export interface ThemeSettings {
	backgroundColor: string
	textColor: string
	accentColor?: string
}

// レスポンシブ設定
export interface ResponsiveConfig {
	breakpoint: number
	isMobile: boolean
	isTablet: boolean
	isDesktop: boolean
}

// アニメーション設定
export interface AnimationConfig {
	duration: number
	easing: string
	delay?: number
}

// ユーティリティ型
export type DeepPartial<T> = {
	[P in keyof T]?: T[P] extends object ? DeepPartial<T[P]> : T[P]
}

export type RequiredFields<T, K extends keyof T> = T & Required<Pick<T, K>>

export type OptionalFields<T, K extends keyof T> = Omit<T, K> & Partial<Pick<T, K>>

// イベントハンドラー型
export type EventHandler<T = Event> = (event: T) => void

export type TouchEventHandler = EventHandler<React.TouchEvent>

export type KeyboardEventHandler = EventHandler<React.KeyboardEvent>

export type MouseEventHandler = EventHandler<React.MouseEvent>

// 非同期処理
export type AsyncResult<T, E = Error> = Promise<{ data: T } | { error: E }>

// 設定値の検証
export interface ValidationRule<T> {
	validate: (value: T) => boolean
	message: string
}

export interface ValidationResult {
	isValid: boolean
	errors: string[]
}

// ログ設定
export interface LoggerConfig {
	level: LogLevel
	enableDebug: boolean
	enableConsole: boolean
	maxLogEntries?: number
}

// パフォーマンス監視
export interface PerformanceMetric {
	name: string
	duration: number
	timestamp: number
	metadata?: Record<string, unknown>
}

// キャッシュ設定
export interface CacheConfig {
	maxSize: number
	ttl: number
	strategy: 'lru' | 'fifo' | 'lfu'
}
