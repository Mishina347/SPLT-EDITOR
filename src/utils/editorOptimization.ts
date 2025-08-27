/**
 * Monaco Editor パフォーマンス最適化ユーティリティ
 */

// グリッドスタイルのキャッシュ
let currentGridCSS = ''
let gridStyleElement: HTMLStyleElement | null = null

/**
 * 最適化されたグリッドCSS更新
 * 同じスタイルの場合は更新をスキップ
 */
export function updateGridCSSOptimized(cellSize: number): void {
	const sizePx = `${cellSize}px`
	const newCSS = `
    .monaco-editor .view-line {
      background-image: 
        linear-gradient(to right, rgba(0,0,0,0.2) 1px, transparent 1px),
        linear-gradient(to bottom, rgba(0,0,0,0.2) 1px, transparent 1px);
      background-size: ${sizePx} ${sizePx};
    }
  `

	// 同じCSSの場合はスキップ
	if (newCSS === currentGridCSS) {
		return
	}

	const styleId = 'monaco-grid-style'

	if (!gridStyleElement) {
		gridStyleElement = document.getElementById(styleId) as HTMLStyleElement | null

		if (!gridStyleElement) {
			gridStyleElement = document.createElement('style')
			gridStyleElement.id = styleId
			document.head.appendChild(gridStyleElement)
		}
	}

	gridStyleElement.innerHTML = newCSS
	currentGridCSS = newCSS
}

/**
 * スタイル要素のクリーンアップ
 */
export function cleanupGridCSS(): void {
	if (gridStyleElement) {
		gridStyleElement.remove()
		gridStyleElement = null
		currentGridCSS = ''
	}
}

/**
 * Monaco Editor 設定の最適化
 */
export function getOptimizedEditorOptions(baseOptions: any) {
	return {
		...baseOptions,
		// パフォーマンス最適化
		automaticLayout: false, // 手動レイアウトで高速化
		scrollbar: {
			...baseOptions.scrollbar,
			alwaysConsumeMouseWheel: false, // マウスホイールイベントの最適化
		},
		minimap: {
			enabled: false, // ミニマップを無効化して軽量化
		},
		// モバイルでのピンチズームを有効化
		mouseWheelZoom: true, // マウスホイールでのズームを有効化
		fastScrollSensitivity: 5, // 高速スクロール感度を調整
		// タッチデバイスでの操作を最適化
		multiCursorModifier: 'alt' as const, // モバイルでのマルチカーソル操作をaltキーに変更
		// レンダリング最適化
		renderControlCharacters: false,
		renderFinalNewline: 'on' as const,
		renderLineHighlight: 'line' as const,
		renderLineHighlightOnlyWhenFocus: true, // フォーカス時のみハイライト
		// スクロール最適化
		smoothScrolling: false, // スムーススクロールを無効化
		cursorSmoothCaretAnimation: 'off' as const, // カーソルアニメーションを無効化
		// IME入力最適化
		disableLayerHinting: true, // レイヤーヒンティングを無効化（IME入力での安定性向上）
		renderValidationDecorations: 'off' as const, // 検証デコレーションを無効化
		showUnused: false, // 未使用コード表示を無効化
		wordWrapBreakAfterCharacters: ' \t})]?|&,;', // 改行位置の最適化
		wordWrapBreakBeforeCharacters: '{([+', // 改行前の文字指定
		// 検索最適化
		find: {
			addExtraSpaceOnTop: false,
			autoFindInSelection: 'never' as const,
		},
		// 編集操作の最適化
		wordBasedSuggestions: 'off' as const, // 単語ベース提案を無効化
		quickSuggestions: false, // クイック提案を無効化
		acceptSuggestionOnEnter: 'off' as const, // Enterでの提案受け入れを無効化
		acceptSuggestionOnCommitCharacter: false, // コミット文字での提案受け入れを無効化
		suggestOnTriggerCharacters: false, // トリガー文字での提案を無効化
		// フォーカス時のちらつき防止
		hideCursorInOverviewRuler: true, // オーバービューでカーソルを非表示
		overviewRulerBorder: false, // オーバービューの境界線を無効
	}
}

/**
 * バッチでのDOM更新を管理するクラス
 */
export class DOMBatcher {
	private updates: (() => void)[] = []
	private rafId: number | null = null

	/**
	 * DOM更新をバッチに追加
	 */
	addUpdate(update: () => void): void {
		this.updates.push(update)
		this.scheduleFlush()
	}

	/**
	 * バッチ更新をスケジュール
	 */
	private scheduleFlush(): void {
		if (this.rafId !== null) {
			return
		}

		this.rafId = requestAnimationFrame(() => {
			this.flush()
		})
	}

	/**
	 * バッチ更新を実行
	 */
	private flush(): void {
		const updates = this.updates.splice(0)
		this.rafId = null

		// 全ての更新を一度に実行
		updates.forEach(update => {
			try {
				update()
			} catch (error) {
				console.error('DOM update error:', error)
			}
		})
	}

	/**
	 * バッチ更新をキャンセル
	 */
	cancel(): void {
		if (this.rafId !== null) {
			cancelAnimationFrame(this.rafId)
			this.rafId = null
		}
		this.updates.length = 0
	}
}

// グローバルなDOMバッチャー
export const domBatcher = new DOMBatcher()

/**
 * パフォーマンス測定ヘルパー
 */
export class PerformanceMonitor {
	private measurements: Map<string, number[]> = new Map()

	/**
	 * 計測開始
	 */
	start(name: string): () => void {
		const startTime = performance.now()

		return () => {
			const duration = performance.now() - startTime
			this.addMeasurement(name, duration)
		}
	}

	/**
	 * 計測値を追加
	 */
	private addMeasurement(name: string, duration: number): void {
		const measurements = this.measurements.get(name) || []
		measurements.push(duration)

		// 最新100件のみ保持
		if (measurements.length > 100) {
			measurements.shift()
		}

		this.measurements.set(name, measurements)
	}

	/**
	 * 統計情報を取得
	 */
	getStats(name: string): { avg: number; min: number; max: number; count: number } | null {
		const measurements = this.measurements.get(name)
		if (!measurements || measurements.length === 0) {
			return null
		}

		const count = measurements.length
		const sum = measurements.reduce((a, b) => a + b, 0)
		const avg = sum / count
		const min = Math.min(...measurements)
		const max = Math.max(...measurements)

		return { avg, min, max, count }
	}

	/**
	 * 全ての統計情報を出力
	 */
	logAllStats(): void {
		console.group('Performance Stats')
		for (const [name] of this.measurements) {
			const stats = this.getStats(name)
			if (stats) {
				console.log(`${name}:`, stats)
			}
		}
		console.groupEnd()
	}

	/**
	 * 計測データをクリア
	 */
	clear(): void {
		this.measurements.clear()
	}
}

// グローバルなパフォーマンスモニター
export const performanceMonitor = new PerformanceMonitor()

/**
 * 開発環境でのパフォーマンス監視
 */
if (process.env.NODE_ENV === 'development') {
	// 5秒ごとに統計を出力
	setInterval(() => {
		performanceMonitor.logAllStats()
	}, 5000)
}
