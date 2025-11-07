# セキュリティ

このドキュメントでは、face-checkアプリケーションのセキュリティ対策とテストについて説明します。

## セキュリティテストツール

このプロジェクトでは、以下のセキュリティテストツールを使用しています：

### 1. npm audit
**用途**: npm パッケージの既知の脆弱性を検出

```bash
npm audit
```

### 2. retire.js
**用途**: JavaScript ライブラリの既知の脆弱性を検出

```bash
npm run security:retire
```

### 3. ESLint Security Plugin
**用途**: JavaScript コードの潜在的なセキュリティ問題を静的解析

```bash
npm run security:lint
```

---

## セキュリティチェックの実行

### すべてのセキュリティチェックを実行

```bash
npm run security
```

または

```bash
bash security-check.sh
```

### 個別のセキュリティチェック

```bash
# 依存関係の脆弱性チェック
npm run security:audit

# ライブラリの脆弱性チェック
npm run security:retire

# コードの静的解析
npm run security:lint
```

---

## セキュリティチェック項目

### 自動チェック項目

- ✅ **依存関係の脆弱性**: npm audit で検出
- ✅ **古いライブラリの使用**: retire.js で検出
- ✅ **危険なコードパターン**: ESLint Security Plugin で検出
  - XSS の可能性
  - 正規表現の ReDoS 攻撃
  - eval の使用
  - タイミング攻撃の可能性

### 手動確認項目

- ⚠️ **innerHTML の安全な使用**: ユーザー入力を直接 innerHTML に設定していないか
- ⚠️ **ユーザー入力のサニタイゼーション**: すべてのユーザー入力が適切に検証されているか
- ⚠️ **HTTPS 接続**: 本番環境で HTTPS を使用しているか（GitHub Pages等）
- ⚠️ **Content Security Policy (CSP)**: CSP ヘッダーが設定されているか
- ⚠️ **カメラアクセス権限**: カメラアクセスが適切に処理されているか

---

## 検出されたセキュリティ問題への対応

### 重大度の分類

- **Critical (重大)**: 即座に対応が必要
- **High (高)**: 優先的に対応
- **Moderate (中)**: 計画的に対応
- **Low (低)**: 時間のあるときに対応

### 対応手順

1. **脆弱性の確認**
   - `npm audit` または `retire.js` の出力を確認
   - 影響範囲を評価

2. **パッケージの更新**
   ```bash
   npm audit fix
   ```

3. **手動での修正**
   - 自動修正できない場合は、パッケージを個別に更新
   ```bash
   npm update <package-name>
   ```

4. **代替パッケージの検討**
   - 脆弱性が修正されていない場合は、代替パッケージを検討

5. **再テスト**
   ```bash
   npm run security
   ```

---

## セキュリティベストプラクティス

### 1. データのサニタイゼーション

```javascript
// ❌ 危険
element.innerHTML = userInput;

// ✅ 安全
element.textContent = userInput;
```

### 2. IndexedDB のセキュリティ

- IndexedDB のデータは暗号化されていません
- 機密情報を保存する場合は、Web Crypto API で暗号化を検討

### 3. カメラアクセス

- ユーザーの明示的な許可を取得
- カメラストリームは使用後に必ず停止

### 4. CSP の設定例

GitHub Pages でホスティングする場合、`index.html` に以下を追加：

```html
<meta http-equiv="Content-Security-Policy" content="
  default-src 'self';
  script-src 'self' https://cdn.jsdelivr.net;
  style-src 'self' 'unsafe-inline';
  img-src 'self' data: blob:;
  connect-src 'self';
  media-src 'self' blob:;
">
```

---

## 継続的なセキュリティ監視

### GitHub Actionsでの自動チェック

CI/CDパイプラインにセキュリティチェックを統合することで、継続的にセキュリティを監視できます。

詳細は `.github/workflows/security.yml` を参照してください。

### Dependabot の有効化

GitHubのDependabotを有効にすることで、依存関係の脆弱性を自動的に検出し、プルリクエストを作成できます。

1. リポジトリの Settings → Security → Dependabot
2. "Enable Dependabot alerts" を有効化
3. "Enable Dependabot security updates" を有効化

---

## セキュリティに関する報告

セキュリティ上の問題を発見した場合は、以下の手順で報告してください：

1. **公開しない**: GitHub Issuesで公開せず、プライベートに報告
2. **詳細を提供**: 脆弱性の詳細、再現手順、影響範囲
3. **連絡先**: [リポジトリオーナーのメールアドレス]

---

## 参考リンク

- [OWASP Top 10](https://owasp.org/www-project-top-ten/)
- [npm audit documentation](https://docs.npmjs.com/cli/v8/commands/npm-audit)
- [retire.js](https://retirejs.github.io/retire.js/)
- [ESLint Security Plugin](https://github.com/eslint-community/eslint-plugin-security)
- [Web Security Best Practices](https://web.dev/secure/)
