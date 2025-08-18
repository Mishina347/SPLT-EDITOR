export function isTauri(): boolean {
	return (
		typeof window !== 'undefined' &&
		'__TAURI__' in window &&
		typeof (window as any).__TAURI__.invoke === 'function'
	)
}
