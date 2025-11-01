# GitHub Actions Workflow セットアップ手順

## 問題

現在、GitHub Actions のワークフローファイルが間違った場所 (`tests/.github/workflows/test.yml`) に配置されており、CI/CDが機能していません。

GitHub App の権限制限により、自動的に正しい場所にプッシュすることができませんでした。

## 手動セットアップ手順

以下の手順で、GitHub Actions を有効化してください：

### 方法1: Web UI から作成（推奨）

1. GitHubのリポジトリページにアクセス
2. "Actions" タブをクリック
3. "set up a workflow yourself" をクリック
4. ファイル名を `.github/workflows/test.yml` に設定
5. 以下の内容をコピー＆ペースト：

```yaml
name: Test

on:
  push:
    branches: [ main, master, claude/** ]
  pull_request:
    branches: [ main, master ]

jobs:
  unit-test:
    runs-on: ubuntu-latest

    steps:
      - uses: actions/checkout@v4

      - name: Setup Node.js
        uses: actions/setup-node@v4
        with:
          node-version: '18'
          cache: 'npm'

      - name: Install dependencies
        run: npm ci

      - name: Run unit tests
        run: npm test

      - name: Upload coverage
        uses: actions/upload-artifact@v3
        with:
          name: coverage
          path: coverage/

  e2e-test:
    runs-on: ubuntu-latest

    steps:
      - uses: actions/checkout@v4

      - name: Setup Node.js
        uses: actions/setup-node@v4
        with:
          node-version: '18'
          cache: 'npm'

      - name: Install dependencies
        run: npm ci

      - name: Install Playwright Browsers
        run: npx playwright install --with-deps chromium

      - name: Run E2E tests
        run: npm run test:e2e

      - name: Upload test results
        if: always()
        uses: actions/upload-artifact@v3
        with:
          name: playwright-report
          path: playwright-report/

  lint:
    runs-on: ubuntu-latest

    steps:
      - uses: actions/checkout@v4

      - name: Setup Node.js
        uses: actions/setup-node@v4
        with:
          node-version: '18'
          cache: 'npm'

      - name: Install dependencies
        run: npm ci

      - name: Run linter
        run: npm run lint
        continue-on-error: true
```

6. "Commit changes" をクリック

### 方法2: ローカルから手動プッシュ

```bash
# ローカルでファイルを作成
mkdir -p .github/workflows
# 上記のYAMLの内容を .github/workflows/test.yml に保存

# 間違った場所のファイルを削除（もしあれば）
rm -rf tests/.github

# コミット＆プッシュ
git add .github/workflows/test.yml
git commit -m "Add GitHub Actions workflow"
git push
```

## 確認方法

1. リポジトリの "Actions" タブを確認
2. ワークフローが実行されていることを確認
3. テストの結果を確認

## セットアップ後

ワークフローが正常に動作すると、以下が自動的に実行されます：

- ✅ 単体テスト (Jest)
- ✅ E2Eテスト (Playwright)
- ✅ Lint (ESLint)

プッシュやプルリクエストの度に自動実行されます。

## このファイルについて

このファイルは一時的なセットアップガイドです。ワークフローのセットアップが完了したら削除してください。

```bash
git rm WORKFLOW_SETUP.md
git commit -m "Remove temporary setup guide"
git push
```
