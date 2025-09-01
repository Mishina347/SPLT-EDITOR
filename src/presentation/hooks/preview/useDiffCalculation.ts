import { useState, useEffect, useRef, useMemo } from 'react'
import { Diff2HtmlAdapter } from '@/infra'
import { wordCounter, formatNumber } from '@/utils'
import { html as diff2html, parse as diffParse } from 'diff2html'

interface UseDiffCalculationProps {
	isDiffMode: boolean
	initialText: string
	currentNotSavedText: string
}

export const useDiffCalculation = ({
	isDiffMode,
	initialText,
	currentNotSavedText,
}: UseDiffCalculationProps) => {
	const [diffHtml, setDiffHtml] = useState('')
	const diffCalculationTimeoutRef = useRef<NodeJS.Timeout>()
	const diffService = useMemo(() => new Diff2HtmlAdapter(), [])

	// DIFFモードが選択された時のみ差分を計算（デバウンス処理付き）
	useEffect(() => {
		if (isDiffMode) {
			// デバウンス処理でパフォーマンスを最適化
			if (diffCalculationTimeoutRef.current) {
				clearTimeout(diffCalculationTimeoutRef.current)
			}

			diffCalculationTimeoutRef.current = setTimeout(() => {
				try {
					// 初回起動時やファイルが存在しない場合
					if (!initialText || !currentNotSavedText) {
						setDiffHtml(`
							<div class="no-diff">
								<p>比較対象がありません</p>
							</div>
						`)
						return
					}

					// 差分計算を実行
					const unifiedDiff = diffService.generateUnifiedDiff(
						'initial',
						'current',
						initialText,
						currentNotSavedText
					)

					// 差分があるかチェック
					if (unifiedDiff) {
						// 変更がある場合
						const beforeStats = wordCounter(initialText || '')
						const afterStats = wordCounter(currentNotSavedText || '')

						// diff2htmlでHTMLを生成
						const diffJson = diffParse(unifiedDiff)
						const diffHtmlResult = diff2html(diffJson, {
							drawFileList: false,
							matching: 'lines',
							outputFormat: 'line-by-line',
						})

						setDiffHtml(`
							<div class="diff-container">
								<div class="diff-header">
									<div class="diff-info">
										<span class="before-text">
											修正前: ${formatNumber(beforeStats.characterCount)}文字
										</span>
										<span class="after-text">
											修正後: ${formatNumber(afterStats.characterCount)}文字
										</span>
										<span class="change-count">
											変更: ${formatNumber(Math.abs(afterStats.characterCount - beforeStats.characterCount))}文字
										</span>
									</div>
								</div>
								${diffHtmlResult}
							</div>
						`)
					} else {
						// 変更がない場合
						const currentStats = wordCounter(currentNotSavedText || '')
						setDiffHtml(`
							<div class="no-diff">
								<p>変更はありません。</p>
								<p>現在の文字数: ${formatNumber(currentStats.characterCount)}文字</p>
							</div>
						`)
					}
				} catch (error) {
					console.error('差分計算エラー:', error)
					setDiffHtml(`
						<div class="error-message">
							<p>差分の計算中にエラーが発生しました</p>
						</div>
					`)
				}
			}, 100) // 100msのデバウンス

			return () => {
				if (diffCalculationTimeoutRef.current) {
					clearTimeout(diffCalculationTimeoutRef.current)
				}
			}
		}
	}, [isDiffMode, initialText, currentNotSavedText, diffService])

	return {
		diffHtml,
	}
}
