/**
 * ストレージリポジトリのインターフェース
 * 永続化が必要なデータの保存・読み込みを定義
 */
export interface StorageRepository {
	/**
	 * キーと値のペアを保存
	 * @param key 保存キー
	 * @param value 保存する値
	 */
	save(key: string, value: any): Promise<void>

	/**
	 * キーに対応する値を読み込み
	 * @param key 読み込みキー
	 * @returns 保存されている値、存在しない場合はnull
	 */
	load(key: string): Promise<any>

	/**
	 * キーに対応する値を削除
	 * @param key 削除キー
	 */
	remove(key: string): Promise<void>

	/**
	 * 全てのデータを削除
	 */
	clear(): Promise<void>

	/**
	 * ストレージが利用可能かチェック
	 * @returns 利用可能な場合true
	 */
	isAvailable(): boolean
}

/**
 * 設定用のストレージリポジトリ
 * アプリケーション設定の保存・読み込みを専用化
 */
export interface SettingsStorageRepository extends StorageRepository {
	/**
	 * アプリケーション設定を保存
	 * @param settings 設定オブジェクト
	 */
	saveSettings(settings: any): Promise<void>

	/**
	 * アプリケーション設定を読み込み
	 * @returns 設定オブジェクト、存在しない場合はnull
	 */
	loadSettings(): Promise<any>
}

/**
 * テーマ用のストレージリポジトリ
 * テーマ設定の保存・読み込みを専用化
 */
export interface ThemeStorageRepository extends StorageRepository {
	/**
	 * テーマ設定を保存
	 * @param themeSettings テーマ設定オブジェクト
	 */
	saveThemeSettings(themeSettings: any): Promise<void>

	/**
	 * テーマ設定を読み込み
	 * @returns テーマ設定オブジェクト、存在しない場合はnull
	 */
	loadThemeSettings(): Promise<any>
}
