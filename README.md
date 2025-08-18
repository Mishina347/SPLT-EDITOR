# SPLT (Tauri + React + Monaco) — Clean Architecture

日本語の縦書きテキストエディタアプリケーションです。

## 機能

- 縦書きプレビュー
- テーマカスタマイズ（背景色・文字色）
- 履歴管理と差分表示
- DOCX/TXTエクスポート
- ファイル読み込み
- レスポンシブレイアウト

## セットアップ

1. 依存関係をインストール

```bash
npm install
# または
pnpm install
```

2. 開発モードで実行

```bash
npm run tauri
```

TauriウィンドウでReactアプリが開きます。

## 技術スタック

- **フロントエンド**: React + TypeScript
- **エディタ**: Monaco Editor
- **デスクトップ**: Tauri (Rust)
- **アーキテクチャ**: Clean Architecture
- **スタイリング**: CSS Modules

## 注意事項

- Tauriを使用する場合は、Rustツールチェーンなどの前提条件が必要です
- 純粋なWeb開発の場合は `npm run dev` (vite) で十分です
