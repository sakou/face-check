#!/bin/bash

# GitHub Issue作成スクリプト
# 使い方:
#   1. GitHub Personal Access Token を取得（repo権限が必要）
#      https://github.com/settings/tokens
#   2. 環境変数を設定: export GITHUB_TOKEN="your_token_here"
#   3. リポジトリ名を設定: export GITHUB_REPO="owner/repo"
#   4. このスクリプトを実行: bash create-issues.sh

set -e

# 環境変数チェック
if [ -z "$GITHUB_TOKEN" ]; then
    echo "Error: GITHUB_TOKEN環境変数が設定されていません"
    echo "以下のコマンドで設定してください:"
    echo "  export GITHUB_TOKEN=\"your_token_here\""
    echo ""
    echo "トークンの取得: https://github.com/settings/tokens"
    echo "必要な権限: repo"
    exit 1
fi

if [ -z "$GITHUB_REPO" ]; then
    echo "Error: GITHUB_REPO環境変数が設定されていません"
    echo "以下のコマンドで設定してください:"
    echo "  export GITHUB_REPO=\"owner/repo\"  # 例: sakou/face-check"
    exit 1
fi

echo "GitHub Issue作成を開始します..."
echo "リポジトリ: $GITHUB_REPO"
echo ""

# issues.jsonを読み込んで処理
jq -c '.[]' issues.json | while read -r issue; do
    title=$(echo "$issue" | jq -r '.title')
    body=$(echo "$issue" | jq -r '.body')
    labels=$(echo "$issue" | jq -c '.labels')

    echo "作成中: $title"

    # GitHub APIでissueを作成
    response=$(curl -s -X POST \
        -H "Authorization: token $GITHUB_TOKEN" \
        -H "Accept: application/vnd.github.v3+json" \
        "https://api.github.com/repos/$GITHUB_REPO/issues" \
        -d "{
            \"title\": $(echo "$title" | jq -R .),
            \"body\": $(echo "$body" | jq -R -s .),
            \"labels\": $labels
        }")

    # エラーチェック
    if echo "$response" | jq -e '.message' > /dev/null 2>&1; then
        echo "  エラー: $(echo "$response" | jq -r '.message')"
    else
        issue_number=$(echo "$response" | jq -r '.number')
        issue_url=$(echo "$response" | jq -r '.html_url')
        echo "  ✓ 作成完了: #$issue_number ($issue_url)"
    fi

    # APIレート制限を避けるため少し待機
    sleep 1
done

echo ""
echo "すべてのissue作成が完了しました！"
