/**
 * デバイス判定用ユーティリティ
 */

export const isMobile = (): boolean => {
	return /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent)
}

export const isMobileSize = (): boolean => {
	const viewport = getViewportSize()
	return Math.min(viewport.width, viewport.height) <= 768
}

export const isAndroid = (): boolean => {
	return /Android/i.test(navigator.userAgent)
}

export const isIOS = (): boolean => {
	return /iPhone|iPad|iPod/i.test(navigator.userAgent)
}

export const isTouchDevice = (): boolean => {
	return 'ontouchstart' in window || navigator.maxTouchPoints > 0
}

export const getViewportSize = () => {
	return {
		width: window.innerWidth,
		height: window.innerHeight,
	}
}

export const isTablet = (): boolean => {
	const viewport = getViewportSize()
	return isTouchDevice() && Math.min(viewport.width, viewport.height) >= 768
}

export const isPortrait = (): boolean => {
	const viewport = getViewportSize()
	return viewport.height > viewport.width
}
