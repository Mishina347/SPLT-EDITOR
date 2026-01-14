import { Manuscript, ManuscriptLine } from '../entities/Manuscript'

/**
 * ルビ記法を解析してテキストとルビを分離する
 * 対応記法: 漢字|かんじ 形式（半角パイプまたは全角パイプ）
 * @param line 解析対象の行
 * @returns テキストとルビを含むオブジェクト
 */
function parseRubyNotation(line: string): { text: string; ruby?: string } {
	// |（半角パイプ）または｜（全角パイプ）記法を検出する正規表現
	// 形式: 文字列|ルビ または 文字列｜ルビ
	const rubyPattern = /([^|｜]+)[|｜]([^|｜\n]+)/g
	const matches = Array.from(line.matchAll(rubyPattern))

	if (matches.length === 0) {
		// ルビ記法が見つからない場合はそのまま返す
		return { text: line || ' ' }
	}

	// 最初のマッチを処理（複数のルビがある場合は最初のもののみ）
	const match = matches[0]
	const baseText = match[1].trim() // ルビが付く文字（前後の空白を除去）
	const rubyText = match[2].trim() // ルビのテキスト（前後の空白を除去）

	// ルビ記法を除去したテキストを作成（パイプとルビ部分を削除）
	const textWithoutRuby = line.replace(rubyPattern, '$1').trim()

	return {
		text: textWithoutRuby || ' ',
		ruby: rubyText,
	}
}

/**
 * プレーンテキストをManuscript形式に変換する
 * @param text 変換対象のテキスト
 * @param title 原稿のタイトル（デフォルト: "原稿"）
 * @returns Manuscriptオブジェクト
 */
export const convertTextToManuscript = (text: string, title: string): Manuscript => {
	if (!text || text.trim() === '') {
		return {
			title,
			pages: [[{ text: '' }]],
		}
	}

	// テキストを行に分割
	const lines = text.split('\n')

	// 各行をManuscriptLine形式に変換（ルビ記法を解析）
	const manuscriptLines: ManuscriptLine[] = lines.map(line => {
		const parsed = parseRubyNotation(line)
		return {
			text: parsed.text || ' ', // 空行の場合はスペースを入れる
			ruby: parsed.ruby,
		}
	})

	// ページとして返す（現在は1ページに全ての行を含める）
	return {
		title,
		pages: [manuscriptLines],
	}
}
