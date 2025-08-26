#!/usr/bin/env node

/**
 * フォントファイルをBase64に変換するスクリプト
 * 使用方法: node scripts/convertFontToBase64.js
 */

const fs = require('fs')
const path = require('path')

// 入力ファイルと出力ファイルのパス
const inputFontPath = path.join(__dirname, '../public/fonts/NotoSerifJP-Regular.ttf')
const outputBase64Path = path.join(__dirname, '../public/fonts/NotoSerifJP-Regular.base64.txt')

function convertFontToBase64() {
	try {
		// フォントファイルの存在確認
		if (!fs.existsSync(inputFontPath)) {
			console.error(`エラー: フォントファイルが見つかりません: ${inputFontPath}`)
			console.log('public/fonts/NotoSerifJP-Regular.ttf が存在することを確認してください。')
			process.exit(1)
		}

		// フォントファイルを読み込み
		console.log('フォントファイルを読み込み中...')
		const fontBuffer = fs.readFileSync(inputFontPath)

		// ファイルサイズの確認
		const fileSizeMB = fontBuffer.length / (1024 * 1024)
		console.log(`フォントファイルサイズ: ${fileSizeMB.toFixed(2)}MB`)

		// Base64エンコード
		console.log('Base64エンコード中...')
		const fontBase64 = fontBuffer.toString('base64')

		// 出力ファイルに保存
		console.log('Base64ファイルを保存中...')
		fs.writeFileSync(outputBase64Path, fontBase64)

		console.log(`✅ 完了: ${outputBase64Path}`)
		console.log(`Base64データの長さ: ${fontBase64.length} 文字`)

		// ファイルサイズの比較
		const base64SizeKB = fs.statSync(outputBase64Path).size / 1024
		console.log(`Base64ファイルサイズ: ${base64SizeKB.toFixed(2)}KB`)
		console.log(`圧縮率: ${((1 - base64SizeKB / (fileSizeMB * 1024)) * 100).toFixed(1)}%`)
	} catch (error) {
		console.error('エラーが発生しました:', error.message)
		process.exit(1)
	}
}

// スクリプトの実行
if (require.main === module) {
	convertFontToBase64()
}

module.exports = { convertFontToBase64 }
