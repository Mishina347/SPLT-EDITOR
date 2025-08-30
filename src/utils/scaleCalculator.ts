/**
 * 要素の倍率を計算するユーティリティ関数
 */

import { ScaleInfo } from '../types/common'

/**
 * 要素のCSS倍率を計算
 * @param element 対象のDOM要素
 * @returns 倍率情報
 */
export function calculateElementScale(element: HTMLElement): ScaleInfo {
	const style = window.getComputedStyle(element)

	// CSS zoomプロパティから倍率を取得
	const zoom = parseFloat(style.zoom) || 1

	// CSS transformから倍率を取得
	let transformScale = 1
	const transform = style.transform

	if (transform && transform !== 'none') {
		try {
			const matrix = new DOMMatrix(transform)
			// 2D変換行列からスケール値を抽出
			transformScale = Math.sqrt(matrix.a * matrix.a + matrix.b * matrix.b)
		} catch (error) {
			console.warn('[ScaleCalculator] Failed to parse transform matrix:', error)
		}
	}

	// 総合的な倍率を計算
	const totalScale = zoom * transformScale

	return {
		zoom,
		transformScale,
		totalScale,
		viewportScale: 1, // デフォルト値、必要に応じて更新
	}
}

/**
 * ビューポートのスケールを含む倍率情報を計算
 * @param element 対象のDOM要素
 * @returns ビューポートスケールを含む倍率情報
 */
export function calculateScaleWithViewport(element: HTMLElement): ScaleInfo {
	const baseScale = calculateElementScale(element)
	const viewport = element.ownerDocument?.defaultView

	if (viewport) {
		baseScale.viewportScale = viewport.visualViewport?.scale || 1
	}

	return baseScale
}

/**
 * 倍率を考慮した座標を正規化
 * @param x X座標
 * @param y Y座標
 * @param scaleInfo 倍率情報
 * @returns 正規化された座標
 */
export function normalizeCoordinates(
	x: number,
	y: number,
	scaleInfo: ScaleInfo
): { x: number; y: number } {
	return {
		x: x / scaleInfo.totalScale,
		y: y / scaleInfo.totalScale,
	}
}

/**
 * 正規化された座標を倍率を考慮して復元
 * @param x 正規化されたX座標
 * @param y 正規化されたY座標
 * @param scaleInfo 倍率情報
 * @returns 復元された座標
 */
export function restoreCoordinates(
	x: number,
	y: number,
	scaleInfo: ScaleInfo
): { x: number; y: number } {
	return {
		x: x * scaleInfo.totalScale * scaleInfo.viewportScale,
		y: y * scaleInfo.totalScale * scaleInfo.viewportScale,
	}
}

/**
 * 要素の現在の倍率を監視するためのコールバック型
 */
export type ScaleChangeCallback = (scaleInfo: ScaleInfo) => void

/**
 * 要素の倍率変更を監視
 * @param element 監視対象の要素
 * @param callback 倍率変更時のコールバック
 * @returns 監視を停止する関数
 */
export function observeScaleChanges(
	element: HTMLElement,
	callback: ScaleChangeCallback
): () => void {
	let lastScaleInfo = calculateElementScale(element)

	const observer = new MutationObserver(() => {
		const currentScaleInfo = calculateElementScale(element)

		// 倍率が変更された場合のみコールバックを実行
		if (
			currentScaleInfo.zoom !== lastScaleInfo.zoom ||
			currentScaleInfo.transformScale !== lastScaleInfo.transformScale
		) {
			lastScaleInfo = currentScaleInfo
			callback(currentScaleInfo)
		}
	})

	// 属性変更とスタイル変更を監視
	observer.observe(element, {
		attributes: true,
		attributeFilter: ['style', 'class'],
		subtree: false,
	})

	// 監視を停止する関数を返す
	return () => observer.disconnect()
}
