import { useEffect, useMemo, useRef, useState } from 'react'

/**
 * デバウンス処理フック
 * @param value デバウンスする値
 * @param delay 遅延時間（ミリ秒）
 * @returns デバウンスされた値
 */
export function useDebounce<T>(value: T, delay: number): T {
	const [debouncedValue, setDebouncedValue] = useState<T>(value)
	const timeoutRef = useRef<NodeJS.Timeout>()

	useEffect(() => {
		// 前のタイマーをクリア
		if (timeoutRef.current) {
			clearTimeout(timeoutRef.current)
		}

		// 新しいタイマーを設定
		timeoutRef.current = setTimeout(() => {
			setDebouncedValue(value)
		}, delay)

		// クリーンアップ
		return () => {
			if (timeoutRef.current) {
				clearTimeout(timeoutRef.current)
			}
		}
	}, [value, delay])

	// コンポーネントのアンマウント時にタイマーをクリア
	useEffect(() => {
		return () => {
			if (timeoutRef.current) {
				clearTimeout(timeoutRef.current)
			}
		}
	}, [])

	return debouncedValue
}

/**
 * デバウンスされたコールバック関数フック
 * @param callback 実行する関数
 * @param delay 遅延時間（ミリ秒）
 * @param dependencies 依存配列
 * @returns デバウンスされたコールバック
 */
export function useDebouncedCallback<TArgs extends any[]>(
	callback: (...args: TArgs) => void,
	delay: number,
	dependencies: React.DependencyList = []
): (...args: TArgs) => void {
	const timeoutRef = useRef<NodeJS.Timeout>()

	const debouncedCallback = useMemo(() => {
		return (...args: TArgs) => {
			// 前のタイマーをクリア
			if (timeoutRef.current) {
				clearTimeout(timeoutRef.current)
			}

			// 新しいタイマーを設定
			timeoutRef.current = setTimeout(() => {
				callback(...args)
			}, delay)
		}
	}, [callback, delay, ...dependencies])

	// クリーンアップ
	useEffect(() => {
		return () => {
			if (timeoutRef.current) {
				clearTimeout(timeoutRef.current)
			}
		}
	}, [])

	return debouncedCallback
}

/**
 * スロットル処理フック
 * @param callback 実行する関数
 * @param delay 実行間隔（ミリ秒）
 * @param dependencies 依存配列
 * @returns スロットルされたコールバック
 */
export function useThrottledCallback<TArgs extends any[]>(
	callback: (...args: TArgs) => void,
	delay: number,
	dependencies: React.DependencyList = []
): (...args: TArgs) => void {
	const lastCallRef = useRef<number>(0)
	const timeoutRef = useRef<NodeJS.Timeout>()

	const throttledCallback = useMemo(() => {
		return (...args: TArgs) => {
			const now = Date.now()
			const timeSinceLastCall = now - lastCallRef.current

			if (timeSinceLastCall >= delay) {
				// すぐに実行
				lastCallRef.current = now
				callback(...args)
			} else {
				// 次の実行をスケジュール
				if (timeoutRef.current) {
					clearTimeout(timeoutRef.current)
				}
				timeoutRef.current = setTimeout(() => {
					lastCallRef.current = Date.now()
					callback(...args)
				}, delay - timeSinceLastCall)
			}
		}
	}, [callback, delay, ...dependencies])

	// クリーンアップ
	useEffect(() => {
		return () => {
			if (timeoutRef.current) {
				clearTimeout(timeoutRef.current)
			}
		}
	}, [])

	return throttledCallback
}
