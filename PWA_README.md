# SPLT EDITOR - PWA対応

## 🚀 PWA（Progressive Web App）機能

SPLT EDITORは、PWA対応により以下の機能を提供します：

### ✨ 主要機能

- **📱 インストール可能**: ホーム画面に追加して、ネイティブアプリのように使用
- **🔄 オフライン対応**: インターネット接続がなくても基本的な機能が利用可能
- **📱 レスポンシブデザイン**: モバイル、タブレット、デスクトップに対応
- **🔄 自動更新**: 新しいバージョンの自動検出と更新

### 🛠️ 技術仕様

- **Service Worker**: オフライン対応とキャッシュ管理
- **Web App Manifest**: インストールとアプリ設定
- **Cache API**: 静的ファイルと動的コンテンツのキャッシュ
- **IndexedDB**: オフラインデータの保存

## 📋 セットアップ手順

### 1. 必要なファイルの確認

以下のファイルが正しく配置されていることを確認してください：

```
public/
├── manifest.json          # PWA設定ファイル
├── sw.js                 # Service Worker
├── icons/                # アプリアイコン
│   ├── icon-16x16.png
│   ├── icon-32x32.png
│   ├── icon-72x72.png
│   ├── icon-96x96.png
│   ├── icon-128x128.png
│   ├── icon-144x144.png
│   ├── icon-152x152.png
│   ├── icon-192x192.png
│   ├── icon-384x384.png
│   └── icon-512x512.png
└── splash/               # スプラッシュスクリーン
    ├── apple-splash-2048-2732.png
    ├── apple-splash-1668-2388.png
    ├── apple-splash-1536-2048.png
    ├── apple-splash-1125-2436.png
    ├── apple-splash-1242-2688.png
    ├── apple-splash-750-1334.png
    └── apple-splash-640-1136.png
```

### 2. アイコンファイルの作成

各サイズのアイコンファイルを作成してください。推奨サイズ：

- **16x16**: ファビコン
- **32x32**: ファビコン（高解像度）
- **72x72**: Android 低解像度
- **96x96**: Android 中解像度
- **128x128**: Android 高解像度
- **144x144**: Android 超高解像度
- **152x152**: iOS タブレット
- **192x192**: Android 超高解像度、Chrome
- **384x384**: Android 超高解像度
- **512x512**: Android 超高解像度、Chrome

### 3. スプラッシュスクリーンの作成

各デバイスサイズに対応したスプラッシュスクリーンを作成してください。

## 🔧 使用方法

### PWAインストールボタンの表示

```tsx
import { PWAInstallButton } from '@/components'

function App() {
	return (
		<div>
			<h1>SPLT EDITOR</h1>
			<PWAInstallButton
				size="medium"
				variant="primary"
				installTitle="SPLT EDITORをインストール"
				installDescription="ホーム画面に追加して、より快適に使用できます"
			/>
		</div>
	)
}
```

### PWA状態の表示

```tsx
import { PWAStatus } from '@/components'

function App() {
	return (
		<div>
			<h1>PWA状態</h1>
			{/* 最小表示 */}
			<PWAStatus detail="minimal" />

			{/* 詳細表示 */}
			<PWAStatus detail="detailed" />
		</div>
	)
}
```

### PWAフックの使用

```tsx
import { usePWA } from '@/hooks'

function App() {
	const {
		isInstallable,
		isInstalled,
		isOffline,
		isUpdateAvailable,
		installPWA,
		updateServiceWorker,
		clearCache,
		requestNotificationPermission,
		sendNotification,
	} = usePWA()

	const handleInstall = async () => {
		try {
			await installPWA({
				title: 'カスタムタイトル',
				description: 'カスタム説明',
				icon: '/custom-icon.png',
			})
		} catch (error) {
			console.error('インストールに失敗:', error)
		}
	}

	return (
		<div>
			{isInstallable && <button onClick={handleInstall}>インストール</button>}

			{isOffline && <div>オフラインです</div>}

			{isUpdateAvailable && <button onClick={updateServiceWorker}>更新を適用</button>}
		</div>
	)
}
```

## 🧪 テスト方法

### 1. 開発環境でのテスト

```bash
npm run dev
```

ブラウザの開発者ツールで以下を確認：

- **Application** > **Service Workers**: Service Workerの登録状態
- **Application** > **Manifest**: Web App Manifestの内容
- **Application** > **Storage**: キャッシュとIndexedDBの状態

### 2. 本番環境でのテスト

```bash
npm run build
npm run preview
```

### 3. PWAのテスト

1. **インストールテスト**: インストールボタンが表示されるか
2. **オフラインテスト**: ネットワークをオフラインにして動作確認
3. **更新テスト**: 新しいバージョンの検出と更新
4. **通知テスト**: プッシュ通知の送受信

## 📱 ブラウザ対応

### 完全対応

- Chrome 67+
- Edge 79+
- Firefox 67+
- Safari 11.1+ (macOS)
- Safari 11.3+ (iOS)

### 部分対応

- Safari 10.1+ (macOS)
- Safari 10.3+ (iOS)

## 🔒 セキュリティ

- **HTTPS必須**: PWA機能はHTTPS環境でのみ動作
- **Service Worker**: 安全なコンテキストでのみ実行
- **プッシュ通知**: ユーザーの明示的な許可が必要

## 🚨 トラブルシューティング

### よくある問題

#### 1. Service Workerが登録されない

**原因**: HTTPS環境でない、またはファイルパスが間違っている
**解決**: HTTPS環境で実行し、ファイルパスを確認

#### 2. インストールボタンが表示されない

**原因**: `beforeinstallprompt`イベントが発生していない
**解決**: PWAの条件を満たしているか確認（HTTPS、Service Worker、Manifest）

#### 3. オフラインで動作しない

**原因**: キャッシュが正しく設定されていない
**解決**: Service Workerのキャッシュ設定を確認

#### 4. アイコンが表示されない

**原因**: アイコンファイルが存在しない、またはパスが間違っている
**解決**: アイコンファイルの存在とパスを確認

### デバッグ方法

1. **ブラウザの開発者ツール**を使用
2. **Console**でエラーメッセージを確認
3. **Network**タブでリクエストの状態を確認
4. **Application**タブでPWA関連の設定を確認

## 📚 参考資料

- [Progressive Web Apps - MDN](https://developer.mozilla.org/en-US/docs/Web/Progressive_web_apps)
- [Service Worker API - MDN](https://developer.mozilla.org/en-US/docs/Web/API/Service_Worker_API)
- [Web App Manifest - MDN](https://developer.mozilla.org/en-US/docs/Web/Manifest)
- [PWA Builder](https://www.pwabuilder.com/)

## 🤝 貢献

PWA機能の改善や新機能の提案は、IssueやPull Requestでお待ちしています。

## 📄 ライセンス

このプロジェクトはMITライセンスの下で公開されています。
