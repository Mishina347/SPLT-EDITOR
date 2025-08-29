// 実行時（ブラウザ環境）でのTauri判定
export function isTauri(): boolean {
	return (
		typeof window !== 'undefined' &&
		'__TAURI__' in window &&
		typeof (window as any).__TAURI__.invoke === 'function'
	)
}

// ビルド時（Node.js環境）でのTauri判定
export function isTauriBuild(): boolean {
	// より確実なTauri環境の判定
	const isTauriEnv =
		process.env.TAURI_PLATFORM !== undefined ||
		process.env.npm_lifecycle_event === 'tauri:build' ||
		process.env.npm_lifecycle_event === 'tauri:dev' ||
		process.argv.includes('--tauri') ||
		process.argv.includes('tauri') ||
		process.cwd().includes('tauri') ||
		// 追加の判定条件
		(process.env.npm_lifecycle_event === 'build' && process.argv.includes('tauri')) ||
		(process.env.npm_lifecycle_event === 'build' && process.cwd().includes('tauri')) ||
		// ファイルの存在確認（Node.js環境でのみ実行）
		(typeof process !== 'undefined' &&
			process.versions?.node &&
			(() => {
				try {
					const fs = require('fs')
					return fs.existsSync('./src-tauri/Cargo.toml') || fs.existsSync('./src-tauri/tauri.conf.json')
				} catch {
					return false
				}
			})()) ||
		// 実行コマンドの詳細確認
		process.argv.some(arg => arg.includes('tauri')) ||
		process.argv.some(arg => arg.includes('Tauri')) ||
		// プロセスの親プロセス情報
		process.env.npm_config_user_agent?.includes('tauri') ||
		process.env.npm_config_user_agent?.includes('Tauri') ||
		// 環境変数の詳細確認
		process.env.npm_execpath?.includes('tauri') ||
		process.env.npm_execpath?.includes('Tauri') ||
		// スクリプト名の確認
		process.env.npm_lifecycle_script?.includes('tauri') ||
		process.env.npm_lifecycle_script?.includes('Tauri')

	console.log('=== TAURI BUILD DETECTION DEBUG ===')
	console.log('TAURI_PLATFORM:', process.env.TAURI_PLATFORM)
	console.log('npm_lifecycle_event:', process.env.npm_lifecycle_event)
	console.log('npm_lifecycle_script:', process.env.npm_lifecycle_script)
	console.log('npm_execpath:', process.env.npm_execpath)
	console.log('npm_config_user_agent:', process.env.npm_config_user_agent)
	console.log('argv:', process.argv)
	console.log('cwd:', process.cwd())
	console.log(
		'Cargo.toml exists:',
		(() => {
			try {
				const fs = require('fs')
				return fs.existsSync('./src-tauri/Cargo.toml')
			} catch {
				return false
			}
		})()
	)
	console.log(
		'tauri.conf.json exists:',
		(() => {
			try {
				const fs = require('fs')
				return fs.existsSync('./src-tauri/tauri.conf.json')
			} catch {
				return false
			}
		})()
	)
	console.log('isTauriEnv:', isTauriEnv)
	console.log('====================================')

	return isTauriEnv
}
