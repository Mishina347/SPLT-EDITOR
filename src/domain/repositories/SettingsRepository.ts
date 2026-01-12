import { Settings } from '../entities/defaultSetting'

/**
 * 設定リポジトリのインターフェース
 * クリーンアーキテクチャのリポジトリパターン
 * - Domain層で定義されるインターフェース
 * - Infrastructure層で具体的な実装を提供
 */
export interface SettingsRepository {
	/**
	 * 設定を読み込む
	 * @returns 保存されている設定、または存在しない場合はnull
	 */
	loadSettings(): Promise<Settings | null>

	/**
	 * 設定を保存する
	 * @param settings 保存する設定
	 */
	saveSettings(settings: Settings): Promise<void>
}
