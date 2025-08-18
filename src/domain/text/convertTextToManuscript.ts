import { Manuscript, ManuscriptLine } from '../entities/Manuscript'

/**
 * プレーンテキストをManuscript形式に変換する
 * @param text 変換対象のテキスト
 * @param title 原稿のタイトル（デフォルト: "原稿"）
 * @returns Manuscriptオブジェクト
 */
export const convertTextToManuscript = (text: string, title: string = '原稿'): Manuscript => {
	if (!text || text.trim() === '') {
		return {
			title,
			pages: [[{ text: '' }]],
		}
	}

	// テキストを行に分割
	const lines = text.split('\n')

	// 各行をManuscriptLine形式に変換
	const manuscriptLines: ManuscriptLine[] = lines.map(line => ({
		text: line || ' ', // 空行の場合はスペースを入れる
	}))

	// ページとして返す（現在は1ページに全ての行を含める）
	return {
		title,
		pages: [manuscriptLines],
	}
}
