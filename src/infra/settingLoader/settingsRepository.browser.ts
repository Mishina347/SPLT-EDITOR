import { DEFAULT_SETTING, Settings, SettingsRepository } from '../../domain/entities/defaultSetting'

export class BrowserSettingsRepository implements SettingsRepository {
	async loadSettings(): Promise<Settings> {
		// 本当は localStorage や fetch などで実装も可
		console.log('ブラウザモード: デフォルト設定を読み込み')
		return DEFAULT_SETTING as Settings
	}

	async saveSettings(settings: Settings): Promise<void> {
		console.log('ブラウザモード: 設定保存スキップ', settings)
	}
}
