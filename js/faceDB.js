// IndexedDBを使用した顔データの管理

class FaceDB {
    constructor() {
        this.dbName = 'FaceRecognitionDB';
        this.version = 1;
        this.db = null;
    }

    // データベースを初期化
    async init() {
        return new Promise((resolve, reject) => {
            const request = indexedDB.open(this.dbName, this.version);

            request.onerror = () => reject(request.error);
            request.onsuccess = () => {
                this.db = request.result;
                resolve();
            };

            request.onupgradeneeded = (event) => {
                const db = event.target.result;

                // 顔データストア
                if (!db.objectStoreNames.contains('faces')) {
                    const faceStore = db.createObjectStore('faces', { keyPath: 'id', autoIncrement: true });
                    faceStore.createIndex('name', 'name', { unique: false });
                    faceStore.createIndex('timestamp', 'timestamp', { unique: false });
                }

                // クイズ回答データストア
                if (!db.objectStoreNames.contains('quizAnswers')) {
                    const answerStore = db.createObjectStore('quizAnswers', { keyPath: 'id', autoIncrement: true });
                    answerStore.createIndex('faceId', 'faceId', { unique: false });
                }
            };
        });
    }

    // 顔データを保存
    async saveFace(descriptor, imageData, name = 'unknown') {
        return new Promise((resolve, reject) => {
            const transaction = this.db.transaction(['faces'], 'readwrite');
            const store = transaction.objectStore('faces');

            const faceData = {
                descriptor: Array.from(descriptor),
                imageData: imageData,
                name: name,
                timestamp: Date.now(),
                quizAnswers: [] // クイズの回答を記録
            };

            const request = store.add(faceData);
            request.onsuccess = () => resolve(request.result);
            request.onerror = () => reject(request.error);
        });
    }

    // すべての顔データを取得
    async getAllFaces() {
        return new Promise((resolve, reject) => {
            const transaction = this.db.transaction(['faces'], 'readonly');
            const store = transaction.objectStore('faces');
            const request = store.getAll();

            request.onsuccess = () => resolve(request.result);
            request.onerror = () => reject(request.error);
        });
    }

    // 名前付きの顔データのみ取得
    async getNamedFaces() {
        const allFaces = await this.getAllFaces();
        return allFaces.filter(face => face.name && face.name !== 'unknown');
    }

    // unknown（名前未設定）の顔データを取得
    async getUnknownFaces() {
        const allFaces = await this.getAllFaces();
        return allFaces.filter(face => !face.name || face.name === 'unknown');
    }

    // IDで顔データを取得
    async getFaceById(id) {
        return new Promise((resolve, reject) => {
            const transaction = this.db.transaction(['faces'], 'readonly');
            const store = transaction.objectStore('faces');
            const request = store.get(id);

            request.onsuccess = () => resolve(request.result);
            request.onerror = () => reject(request.error);
        });
    }

    // 顔データを更新
    async updateFace(id, updates) {
        const face = await this.getFaceById(id);
        if (!face) {
            throw new Error('Face not found');
        }

        return new Promise((resolve, reject) => {
            const transaction = this.db.transaction(['faces'], 'readwrite');
            const store = transaction.objectStore('faces');

            const updatedFace = { ...face, ...updates };
            const request = store.put(updatedFace);

            request.onsuccess = () => resolve(request.result);
            request.onerror = () => reject(request.error);
        });
    }

    // 顔の名前を更新
    async updateFaceName(id, name) {
        return this.updateFace(id, { name: name });
    }

    // クイズの回答を記録
    async addQuizAnswer(faceId, answer) {
        const face = await this.getFaceById(faceId);
        if (!face) {
            throw new Error('Face not found');
        }

        if (!face.quizAnswers) {
            face.quizAnswers = [];
        }

        face.quizAnswers.push({
            answer: answer,
            timestamp: Date.now()
        });

        // 多数決で名前を決定（3回以上の回答があれば）
        if (face.quizAnswers.length >= 3) {
            const answerCounts = {};
            face.quizAnswers.forEach(item => {
                answerCounts[item.answer] = (answerCounts[item.answer] || 0) + 1;
            });

            // 最も多い回答を取得
            let maxCount = 0;
            let mostCommonAnswer = 'unknown';
            for (const [answer, count] of Object.entries(answerCounts)) {
                if (count > maxCount) {
                    maxCount = count;
                    mostCommonAnswer = answer;
                }
            }

            // 過半数（50%以上）の回答があれば名前を確定
            if (maxCount >= face.quizAnswers.length / 2) {
                face.name = mostCommonAnswer;
            }
        }

        return this.updateFace(faceId, face);
    }

    // 顔データを削除
    async deleteFace(id) {
        return new Promise((resolve, reject) => {
            const transaction = this.db.transaction(['faces'], 'readwrite');
            const store = transaction.objectStore('faces');
            const request = store.delete(id);

            request.onsuccess = () => resolve();
            request.onerror = () => reject(request.error);
        });
    }

    // すべてのデータをクリア
    async clearAll() {
        return new Promise((resolve, reject) => {
            const transaction = this.db.transaction(['faces'], 'readwrite');
            const store = transaction.objectStore('faces');
            const request = store.clear();

            request.onsuccess = () => resolve();
            request.onerror = () => reject(request.error);
        });
    }
}

// グローバルインスタンスを作成
const faceDB = new FaceDB();
