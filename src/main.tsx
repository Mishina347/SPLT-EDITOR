import { useEffect, useState } from 'react'
import ReactDOM from 'react-dom/client'
import App from './App'
import { DEFAULT_SETTING, Settings } from './domain/entities/defaultSetting'
import { loadSettings } from './usecases/settingsUseCase'
import './useMonacoWorker'

function Root() {
	const [settings, setSettings] = useState<Settings>(DEFAULT_SETTING)

	useEffect(() => {
		loadSettings().then(setSettings)
	}, [])

	if (!settings) {
		return <div style={{ margin: 'auto' }}>Loading settings...</div>
	}

	return <App initSettings={settings} />
}

ReactDOM.createRoot(document.getElementById('root')!).render(<Root />)
