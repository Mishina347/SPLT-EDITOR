/**
 * 端末のサイズに応じてmanifestのorientationを動的に変更するユーティリティ
 */

// スマホサイズの閾値（ピクセル）
const MOBILE_BREAKPOINT = 768

/**
 * 現在の端末がスマホサイズかどうかを判定
 */
export const isMobileSize = (): boolean => {
  if (typeof window === 'undefined') return false
  return window.innerWidth <= MOBILE_BREAKPOINT
}

/**
 * 端末のサイズに応じたorientationを取得
 */
export const getOptimalOrientation = (): 'portrait' | 'landscape' => {
  return isMobileSize() ? 'portrait' : 'landscape'
}

/**
 * manifestのorientationを動的に更新
 */
export const updateManifestOrientation = (): void => {
  if (typeof window === 'undefined') return
  
  try {
    // 既存のmanifestリンクを取得
    let manifestLink = document.querySelector('link[rel="manifest"]') as HTMLLinkElement
    
    if (!manifestLink) {
      // manifestリンクが存在しない場合は作成
      manifestLink = document.createElement('link')
      manifestLink.rel = 'manifest'
      document.head.appendChild(manifestLink)
    }
    
    // 端末サイズに応じたorientationを設定
    const orientation = getOptimalOrientation()
    
    // manifestの内容を動的に生成
    const manifest = {
      name: 'SPLT-EDITOR',
      short_name: 'SPLT-EDITOR',
      start_url: '/SPLT-EDITOR/',
      scope: '/SPLT-EDITOR/',
      display: 'standalone',
      background_color: '#000000',
      theme_color: '#FFFFFF',
      orientation: orientation,
      icons: [
        {
          src: 'images/icons/icon-192x192.png',
          sizes: '192x192',
          type: 'image/png',
        },
        {
          src: 'images/icons/icon-512x512.png',
          sizes: '512x512',
          type: 'image/png',
        },
      ],
    }
    
    // manifestをBlobとして作成し、URLを生成
    const blob = new Blob([JSON.stringify(manifest)], { type: 'application/json' })
    const manifestUrl = URL.createObjectURL(blob)
    
    // manifestリンクのhrefを更新
    manifestLink.href = manifestUrl
    
    // 古いBlobのURLをクリーンアップ
    setTimeout(() => {
      URL.revokeObjectURL(manifestUrl)
    }, 1000)
    
    console.log(`Manifest orientation updated to: ${orientation}`)
  } catch (error) {
    console.error('Failed to update manifest orientation:', error)
  }
}

/**
 * リサイズイベントでmanifestのorientationを更新
 */
export const setupManifestOrientationListener = (): void => {
  if (typeof window === 'undefined') return
  
  let resizeTimeout: NodeJS.Timeout
  
  const handleResize = () => {
    // リサイズイベントの頻度を制限（300ms間隔）
    clearTimeout(resizeTimeout)
    resizeTimeout = setTimeout(() => {
      updateManifestOrientation()
    }, 300)
  }
  
  // 初期設定
  updateManifestOrientation()
  
  // リサイズイベントリスナーを追加
  window.addEventListener('resize', handleResize)
  
  // クリーンアップ関数を返す
  return () => {
    window.removeEventListener('resize', handleResize)
    clearTimeout(resizeTimeout)
  }
}
