export type Note = {
	id: string
	title: string
	content: string
	updatedAt: number
}

// フォントファミリーの選択肢を定義
export const FONT_FAMILIES = {
	UD_DIGITAL: '"UD デジタル 教科書体 N-R", "Hiragino Sans", "Yu Gothic UI", "Meiryo UI", sans-serif',
	NOTO_SERIF: '"Noto Serif JP", "Yu Mincho", "YuMincho", "Hiragino Mincho Pro", serif',
} as const

// 表示用のラベル
export const FONT_LABELS = {
	UD_DIGITAL: 'ゴシック体',
	NOTO_SERIF: '明朝体',
} as const

export type FontFamily = (typeof FONT_FAMILIES)[keyof typeof FONT_FAMILIES]

// src/domain/EditorSettings.ts
export interface EditorSettings {
	fontSize: number
	wordWrapColumn: number
	backgroundColor: string
	textColor: string
	fontFamily: FontFamily
}
