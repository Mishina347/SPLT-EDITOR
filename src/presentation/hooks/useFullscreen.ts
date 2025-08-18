import { useCallback, useState, useEffect } from 'react'

export const useFullscreen = () => {
	const [isFullscreen, setIsFullscreen] = useState(false)

	// フルスクリーン状態の変化を監視
	useEffect(() => {
		const handleFullscreenChange = () => {
			setIsFullscreen(!!document.fullscreenElement)
		}

		document.addEventListener('fullscreenchange', handleFullscreenChange)
		document.addEventListener('webkitfullscreenchange', handleFullscreenChange)
		document.addEventListener('mozfullscreenchange', handleFullscreenChange)
		document.addEventListener('MSFullscreenChange', handleFullscreenChange)

		// 初期状態を設定
		setIsFullscreen(!!document.fullscreenElement)

		return () => {
			document.removeEventListener('fullscreenchange', handleFullscreenChange)
			document.removeEventListener('webkitfullscreenchange', handleFullscreenChange)
			document.removeEventListener('mozfullscreenchange', handleFullscreenChange)
			document.removeEventListener('MSFullscreenChange', handleFullscreenChange)
		}
	}, [])

	const toggleFullscreen = useCallback(async () => {
		try {
			if (!isFullscreen) {
				// フルスクリーンに入る
				if (document.documentElement.requestFullscreen) {
					await document.documentElement.requestFullscreen()
				} else if ((document.documentElement as any).webkitRequestFullscreen) {
					await (document.documentElement as any).webkitRequestFullscreen()
				} else if ((document.documentElement as any).mozRequestFullScreen) {
					await (document.documentElement as any).mozRequestFullScreen()
				} else if ((document.documentElement as any).msRequestFullscreen) {
					await (document.documentElement as any).msRequestFullscreen()
				}
			} else {
				// フルスクリーンから出る
				if (document.exitFullscreen) {
					await document.exitFullscreen()
				} else if ((document as any).webkitExitFullscreen) {
					await (document as any).webkitExitFullscreen()
				} else if ((document as any).mozCancelFullScreen) {
					await (document as any).mozCancelFullScreen()
				} else if ((document as any).msExitFullscreen) {
					await (document as any).msExitFullscreen()
				}
			}
		} catch (error) {
			console.error('フルスクリーン切り替えエラー:', error)
		}
	}, [isFullscreen])

	return {
		isFullscreen,
		toggleFullscreen,
	}
}
