#!/bin/bash

# 顔認識アプリをPodmanで起動するスクリプト

set -e

IMAGE_NAME="face-recognition-app"
CONTAINER_NAME="face-app"
PORT=8080

echo "🚀 顔認識アプリをPodmanで起動します..."

# 既存のコンテナを停止・削除
if podman ps -a | grep -q $CONTAINER_NAME; then
    echo "📦 既存のコンテナを停止・削除しています..."
    podman stop $CONTAINER_NAME 2>/dev/null || true
    podman rm $CONTAINER_NAME 2>/dev/null || true
fi

# イメージをビルド
echo "🔨 イメージをビルドしています..."
podman build -t $IMAGE_NAME .

# コンテナを起動
echo "▶️  コンテナを起動しています..."
podman run -d -p $PORT:$PORT --name $CONTAINER_NAME $IMAGE_NAME

echo ""
echo "✅ 起動完了！"
echo ""
echo "📱 ブラウザで以下のURLにアクセスしてください："
echo "   http://localhost:$PORT"
echo ""
echo "🛑 停止するには以下のコマンドを実行："
echo "   podman stop $CONTAINER_NAME"
echo ""
echo "🗑️  削除するには以下のコマンドを実行："
echo "   podman rm $CONTAINER_NAME"
echo ""
