import { useEffect, useState } from 'react'
import ReactDOM from 'react-dom/client'
import App from './App'
import { DEFAULT_SETTING, Settings } from './domain/entities/defaultSetting'
import { loadSettings } from './usecases/settingsUseCase'

import { registerSW } from 'virtual:pwa-register'
import type { RegisterSWOptions } from 'vite-plugin-pwa/client'
import './utils/swDebug'
// Monaco Editorのワーカー設定をside-effects importで実行
import '@/useMonacoWorker'
// manifestのorientation管理
import { setupManifestOrientationListener } from './utils/manifestManager'

// Service Workerの動作確認用デバッグ
function debugServiceWorker() {
	if ('serviceWorker' in navigator) {
		console.log('[SW Debug] Service Worker API is available')

		navigator.serviceWorker.getRegistrations().then(registrations => {
			console.log('[SW Debug] Current registrations:', registrations.length)
			registrations.forEach((registration, index) => {
				console.log(`[SW Debug] Registration ${index}:`, {
					scope: registration.scope,
					active: !!registration.active,
					installing: !!registration.installing,
					waiting: !!registration.waiting,
				})
			})
		})

		navigator.serviceWorker.addEventListener('message', event => {
			console.log('[SW Debug] Message from SW:', event.data)
		})

		navigator.serviceWorker.addEventListener('error', event => {
			console.error('[SW Debug] SW Error:', event.error)
		})
	} else {
		console.log('[SW Debug] Service Worker API is not available')
	}
}

function Root() {
	const [settings, setSettings] = useState<Settings>(DEFAULT_SETTING)

	useEffect(() => {
		loadSettings().then(setSettings)
		
		// manifestのorientation管理を初期化
		const cleanup = setupManifestOrientationListener()
		
		// クリーンアップ関数を返す
		return cleanup
	}, [])

	if (!settings) {
		return <div style={{ margin: 'auto' }}>Loading settings...</div>
	}

	return <App initSettings={settings} />
}

// Service Workerの登録とデバッグ
const swRegistration = registerSW({
	immediate: true,
	onNeedRefresh() {
		console.log('[SW] Update available')
	},
	onOfflineReady() {
		console.log('[SW] App ready to work offline')
	},
	onRegistered(registration) {
		console.log('[SW] Service Worker registered:', registration)
		debugServiceWorker()
	},
	onRegisterError(error) {
		console.error('[SW] Registration error:', error)
	},
})

swRegistration()

ReactDOM.createRoot(document.getElementById('root')!).render(<Root />)
