export {
	isMobile,
	isAndroid,
	isIOS,
	isTablet,
	isPortrait,
	getViewportSize,
} from './deviceDetection'
export { isTauri, isTauriBuild } from './isTauri'
export {
	isMobileSize,
	getOptimalOrientation,
	updateManifestOrientation,
	setupManifestOrientationListener,
} from './manifestManager'
export {
	formatNumber,
	isInRange,
	formatBytes,
	formatPercentage,
	clampNumber,
} from './numberFormatter'
export { wordCounter } from './wordCounter'
export { hexToRgba } from './hexToRgba'
export { COLOR_CONSTANTS } from '../presentation/constants/ColorConstants'
export { UI_CONSTANTS } from '../presentation/constants/UIConstants'

export * from './dateFormatter'
export * from './imageUtils'
export * from './textValidator'
export * from './testHelpers'
export * from './performanceOptimizer'
export * from './scaleCalculator'
export * from './numberFormatter'
