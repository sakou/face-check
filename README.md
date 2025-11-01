# 顔認識アプリケーション

ブラウザで動作する顔認識アプリケーションです。カメラで人の顔を認識し、名前を学習・記憶します。

![Test Status](https://github.com/yourusername/face-check/workflows/Test/badge.svg)

## 機能

### 1. リアルタイム表示ページ
- カメラのリアルタイム映像を表示
- 認識した人の一覧を表示（最大20人）
- 古い人から新しい人に自動的に置き換え
- 誤認識を修正するための◯×ボタン

### 2. 管理者用顔登録ページ
- カメラで撮影した顔に名前を登録
- 同一人物を自動判定し、1人1枚のみ表示
- 複数の顔を一括登録

### 3. パブリック用クイズページ
- ランダムに表示される人の名前を当てるクイズ
- 複数回答の多数決で自動学習
- 誰でも参加可能な学習システム

## 技術スタック

- **face-api.js**: ブラウザベースの顔認識ライブラリ
- **IndexedDB**: ローカルストレージでの顔データ管理
- **getUserMedia API**: カメラアクセス
- **HTML/CSS/JavaScript**: フロントエンド
- **Jest**: 単体テスト
- **Playwright**: E2Eテスト
- **GitHub Actions**: CI/CD

## 対応デバイス

- デスクトップPC（Windows/Mac/Linux）
- スマートフォン（iOS/Android）
- タブレット

カメラ付きデバイスが必要です。

## セットアップ

### 必要なもの
- Node.js 18以上
- npm
- カメラ付きデバイス
- モダンブラウザ（Chrome、Firefox、Safari、Edge）

### インストール

```bash
# リポジトリをクローン
git clone https://github.com/yourusername/face-check.git
cd face-check

# 依存関係をインストール
npm install
```

### 開発サーバーの起動

```bash
# HTTPサーバーを起動
npm run serve
```

ブラウザで `http://localhost:8080` にアクセスしてください。

## テスト

### 単体テスト

```bash
# テストを実行
npm test

# カバレッジ付きで実行
npm test -- --coverage

# watchモードで実行
npm run test:watch
```

### E2Eテスト

```bash
# Playwrightをインストール（初回のみ）
npx playwright install

# E2Eテストを実行
npm run test:e2e

# UIモードで実行
npm run test:e2e:ui
```

### Lint

```bash
npm run lint
```

## 使い方

### 1. 初めて使う場合

1. トップページから「管理者用顔登録」を開く
2. カメラに顔を映して「顔をキャプチャ」ボタンをクリック
3. 名前を入力して「登録」ボタンをクリック

### 2. リアルタイム認識

1. トップページから「リアルタイム表示」を開く
2. カメラに顔を映すと自動的に認識が始まります
3. 認識結果が画面下部に表示されます
4. 誤認識があった場合は×ボタンで修正できます

### 3. クイズで学習

1. トップページから「パブリック用クイズ」を開く
2. 表示される顔の名前を入力します
3. 3回以上回答されると、多数決で名前が確定します

## プロジェクト構造

```
face-check/
├── index.html              # トップページ
├── realtime.html           # リアルタイム表示ページ
├── admin.html              # 管理者用顔登録ページ
├── quiz.html               # パブリック用クイズページ
├── css/
│   └── style.css          # スタイルシート
├── js/
│   ├── faceDB.js          # IndexedDB管理
│   ├── faceRecognition.js # 顔認識システム
│   ├── realtime.js        # リアルタイム表示ロジック
│   ├── admin.js           # 管理者用ページロジック
│   └── quiz.js            # クイズページロジック
├── tests/
│   ├── setup.js           # テストセットアップ
│   ├── faceDB.test.js     # 単体テスト
│   └── e2e/
│       └── basic.spec.js  # E2Eテスト
├── package.json
├── playwright.config.js
├── .eslintrc.json
└── .github/
    └── workflows/
        └── test.yml       # GitHub Actions設定
```

## データの保存

すべてのデータはブラウザのIndexedDBにローカル保存されます。
- サーバーへのデータ送信は一切ありません
- プライバシーが保護されます
- ブラウザのデータをクリアすると削除されます

## ブラウザ互換性

- Chrome 60+
- Firefox 55+
- Safari 11+
- Edge 79+

## 注意事項

- カメラへのアクセス許可が必要です
- HTTPSまたはlocalhostでの動作が必要です
- IndexedDBに対応したブラウザが必要です
- face-api.jsのモデルは初回アクセス時にCDNからダウンロードされます

## トラブルシューティング

### カメラが起動しない
- ブラウザのカメラ許可を確認してください
- HTTPSまたはlocalhostでアクセスしているか確認してください
- 他のアプリケーションがカメラを使用していないか確認してください

### 顔が認識されない
- 顔が画面の中央にあるか確認してください
- 十分な明るさがあるか確認してください
- カメラのフォーカスが合っているか確認してください

### テストが失敗する
- Node.js 18以上がインストールされているか確認してください
- `npm install`を実行して依存関係を更新してください
- Playwrightのブラウザがインストールされているか確認してください

## ライセンス

MIT License

## 貢献

プルリクエストを歓迎します！バグ報告や機能リクエストはIssuesで受け付けています。

## 作者

Created with Claude Code
