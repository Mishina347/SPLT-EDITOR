# 辞書データのセットアップ

このアプリケーションでは、静的な日本語辞書データを内蔵して使用できます。

## 利用可能な辞書データ

### 1. EJDict-hand（推奨）

**パブリックドメインの英和辞書データ**

- **URL**: https://kujirahand.com/web-tools/EJDictFreeDL.php
- **項目数**: 約47,000項目
- **形式**: JSON、SQLite、テキスト形式
- **ライセンス**: パブリックドメイン（自由に利用可能）

#### ダウンロード方法

1. 上記URLからJSON形式のデータをダウンロード
2. `public/data/dictionary.json` に配置
3. 以下の形式に変換（必要に応じて）：

```json
[
  {
    "word": "単語",
    "reading": "読み方",
    "senses": ["意味1", "意味2"],
    "common": true,
    "tags": [],
    "partsOfSpeech": []
  }
]
```

### 2. JMDict

**日本語辞書データ（XML形式）**

- **URL**: http://www.edrdg.org/jmdict/j_jmdict.html
- **項目数**: 約200,000項目以上
- **形式**: XML（JSON変換が必要）
- **ライセンス**: CC BY-SA 3.0

#### セットアップ方法

1. JMDictのXMLファイルをダウンロード
2. JSON形式に変換（スクリプトが必要）
3. `public/data/dictionary.json` に配置

### 3. その他の辞書データ

- **日本語語彙データベース（JLD）**: https://www.cjk.org/language/ja/data/japanese/nlp/japanese-lexical-database/
- **Sudachi辞書**: 形態素解析用辞書

## データ形式

辞書データは以下のいずれかの形式で配置してください：

### 形式1: 配列形式

```json
[
  {
    "word": "宇宙",
    "reading": "うちゅう",
    "senses": ["すべての天体を含む無限の空間", "全宇宙"],
    "common": true,
    "tags": [],
    "partsOfSpeech": ["名詞"]
  }
]
```

### 形式2: オブジェクト形式

```json
{
  "宇宙": {
    "reading": "うちゅう",
    "senses": ["すべての天体を含む無限の空間", "全宇宙"],
    "common": true,
    "tags": [],
    "partsOfSpeech": ["名詞"]
  }
}
```

## 配置場所

辞書データファイルは以下の場所に配置してください：

```
public/
  data/
    dictionary.json
```

## 使用方法

1. 辞書データを `public/data/dictionary.json` に配置
2. アプリケーションを起動
3. テキストを選択すると、内蔵辞書で検索されます
4. 内蔵辞書で見つからない場合は、Weblio辞書が表示されます

## 注意事項

- 辞書データのサイズが大きい場合、初回読み込みに時間がかかる可能性があります
- データサイズを考慮して、よく使われる単語のみを内蔵することを推奨します
- ライセンスを確認してから使用してください
