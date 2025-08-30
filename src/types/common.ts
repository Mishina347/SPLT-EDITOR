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
	warnings?: string[]
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

// 状態管理型
export interface BaseState {
	id: string
	timestamp: number
}

export interface UIState extends BaseState {
	isVisible: boolean
	isEnabled: boolean
	isLoading: boolean
}

export interface ComponentState extends UIState {
	className?: string
	style?: React.CSSProperties
}

export interface AnimationState extends BaseState {
	isAnimating: boolean
	progress: number
	duration: number
}

export interface GestureState extends BaseState {
	isActive: boolean
	startPosition: Position
	currentPosition: Position
	delta: Position
}

export interface ResizeState extends BaseState {
	width: number
	height: number
	previousSize: Size
	delta: Size
}

export interface DragState extends BaseState {
	isDragging: boolean
	startPosition: Position
	currentPosition: Position
	delta: Position
	element: HTMLElement | null
}

// Props型
export interface BaseProps {
	id?: string
	className?: string
	style?: React.CSSProperties
	children?: React.ReactNode
}

export interface ClickableProps extends BaseProps {
	onClick?: MouseEventHandler
	onDoubleClick?: MouseEventHandler
	disabled?: boolean
}

export interface InputProps extends BaseProps {
	value?: string
	onChange?: (value: string) => void
	onBlur?: () => void
	onFocus?: () => void
	placeholder?: string
	required?: boolean
}

export interface FormProps extends BaseProps {
	onSubmit?: (data: any) => void
	onReset?: () => void
}

export interface ModalProps extends BaseProps {
	isOpen: boolean
	onClose: () => void
	title?: string
	closeOnOverlayClick?: boolean
}

export interface TooltipProps extends BaseProps {
	content: string
	position?: 'top' | 'bottom' | 'left' | 'right'
	show?: boolean
}

// ユーティリティ型
export type Nullable<T> = T | null
export type Optional<T> = T | undefined
export type ReadonlyType<T> = Readonly<T>
export type Mutable<T> = { -readonly [P in keyof T]: T[P] }

export type ArrayElement<T> = T extends readonly (infer U)[] ? U : never
export type TupleToUnion<T> = T extends readonly any[] ? T[number] : never

export type ExtractProps<T> = T extends React.ComponentType<infer P> ? P : never

export type ComponentProps<T> = T extends React.ComponentType<infer P> ? P : never
export type HookReturn<T> = T extends (...args: any[]) => infer R ? R : never

export type EventMap = {
	click: MouseEvent
	change: Event
	submit: Event
	keydown: KeyboardEvent
	keyup: KeyboardEvent
	mouseenter: MouseEvent
	mouseleave: MouseEvent
	touchstart: TouchEvent
	touchend: TouchEvent
	touchmove: TouchEvent
}

export type EventName = keyof EventMap
export type EventHandlerMap = { [K in EventName]: EventHandler<EventMap[K]> }
