# Node.js 18をベースイメージとして使用
FROM node:18-alpine

# 作業ディレクトリを設定
WORKDIR /app

# package.jsonとpackage-lock.jsonをコピー
COPY package*.json ./

# 依存関係をインストール
RUN npm ci --only=production || npm install --only=production

# アプリケーションファイルをコピー
COPY . .

# ポート8080を公開
EXPOSE 8080

# http-serverをグローバルにインストール
RUN npm install -g http-server

# アプリケーションを起動
CMD ["http-server", "-p", "8080", "-a", "0.0.0.0"]
