#!/bin/bash

# セキュリティチェックスクリプト
# このスクリプトは複数のセキュリティツールを実行して、脆弱性を検出します

set -e

echo "========================================="
echo "セキュリティチェックを開始します"
echo "========================================="
echo ""

# 色の定義
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# 結果を保存する変数
AUDIT_RESULT=0
RETIRE_RESULT=0
LINT_RESULT=0

# 1. npm audit - 依存関係の脆弱性チェック
echo "-----------------------------------"
echo "1. npm audit (依存関係チェック)"
echo "-----------------------------------"
if npm audit --audit-level=moderate; then
    echo -e "${GREEN}✓ npm audit: 問題なし${NC}"
    AUDIT_RESULT=0
else
    echo -e "${RED}✗ npm audit: 脆弱性が検出されました${NC}"
    AUDIT_RESULT=1
fi
echo ""

# 2. retire.js - JavaScriptライブラリの脆弱性チェック
echo "-----------------------------------"
echo "2. retire.js (ライブラリチェック)"
echo "-----------------------------------"
if npx retire --path . --outputformat json --outputpath retire-output.json; then
    echo -e "${GREEN}✓ retire.js: 問題なし${NC}"
    RETIRE_RESULT=0
else
    echo -e "${YELLOW}⚠ retire.js: 警告があります。retire-output.jsonを確認してください${NC}"
    RETIRE_RESULT=1
fi
echo ""

# 3. ESLint Security - コードの静的解析
echo "-----------------------------------"
echo "3. ESLint Security (静的解析)"
echo "-----------------------------------"
if npm run lint; then
    echo -e "${GREEN}✓ ESLint Security: 問題なし${NC}"
    LINT_RESULT=0
else
    echo -e "${YELLOW}⚠ ESLint Security: 警告があります${NC}"
    LINT_RESULT=1
fi
echo ""

# 4. HTMLファイルのセキュリティチェック（手動確認項目）
echo "-----------------------------------"
echo "4. 手動確認項目"
echo "-----------------------------------"
echo "以下の項目を手動で確認してください："
echo "  □ HTMLファイルでのinnerHTMLの安全な使用"
echo "  □ ユーザー入力のサニタイゼーション"
echo "  □ HTTPS接続の使用（GitHub Pages等）"
echo "  □ Content Security Policy (CSP) の設定"
echo "  □ カメラアクセス権限の適切な処理"
echo ""

# 結果サマリー
echo "========================================="
echo "セキュリティチェック結果サマリー"
echo "========================================="

TOTAL_ISSUES=$((AUDIT_RESULT + RETIRE_RESULT + LINT_RESULT))

if [ $AUDIT_RESULT -eq 0 ]; then
    echo -e "${GREEN}✓${NC} npm audit: OK"
else
    echo -e "${RED}✗${NC} npm audit: 問題あり"
fi

if [ $RETIRE_RESULT -eq 0 ]; then
    echo -e "${GREEN}✓${NC} retire.js: OK"
else
    echo -e "${YELLOW}⚠${NC} retire.js: 警告"
fi

if [ $LINT_RESULT -eq 0 ]; then
    echo -e "${GREEN}✓${NC} ESLint Security: OK"
else
    echo -e "${YELLOW}⚠${NC} ESLint Security: 警告"
fi

echo ""
if [ $TOTAL_ISSUES -eq 0 ]; then
    echo -e "${GREEN}=========================================${NC}"
    echo -e "${GREEN}すべてのセキュリティチェックをパスしました！${NC}"
    echo -e "${GREEN}=========================================${NC}"
    exit 0
else
    echo -e "${YELLOW}=========================================${NC}"
    echo -e "${YELLOW}$TOTAL_ISSUES 件の問題または警告があります${NC}"
    echo -e "${YELLOW}詳細を確認して対応してください${NC}"
    echo -e "${YELLOW}=========================================${NC}"
    exit 1
fi
