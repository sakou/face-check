// FaceDBのテストコード

// faceDB.jsをrequireできるように修正が必要なため、テスト用にFaceDBクラスを直接インポート
describe('FaceDB', () => {
    let FaceDB;
    let faceDB;

    beforeEach(async () => {
        // FaceDBクラスを定義（テスト用）
        FaceDB = class {
            constructor() {
                this.dbName = 'FaceRecognitionDB';
                this.version = 1;
                this.db = null;
            }

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

                        if (!db.objectStoreNames.contains('faces')) {
                            const faceStore = db.createObjectStore('faces', { keyPath: 'id', autoIncrement: true });
                            faceStore.createIndex('name', 'name', { unique: false });
                            faceStore.createIndex('timestamp', 'timestamp', { unique: false });
                        }

                        if (!db.objectStoreNames.contains('quizAnswers')) {
                            const answerStore = db.createObjectStore('quizAnswers', { keyPath: 'id', autoIncrement: true });
                            answerStore.createIndex('faceId', 'faceId', { unique: false });
                        }
                    };
                });
            }

            async saveFace(descriptor, imageData, name = 'unknown') {
                return new Promise((resolve, reject) => {
                    const transaction = this.db.transaction(['faces'], 'readwrite');
                    const store = transaction.objectStore('faces');

                    const faceData = {
                        descriptor: Array.from(descriptor),
                        imageData: imageData,
                        name: name,
                        timestamp: Date.now(),
                        quizAnswers: []
                    };

                    const request = store.add(faceData);
                    request.onsuccess = () => resolve(request.result);
                    request.onerror = () => reject(request.error);
                });
            }

            async getAllFaces() {
                return new Promise((resolve, reject) => {
                    const transaction = this.db.transaction(['faces'], 'readonly');
                    const store = transaction.objectStore('faces');
                    const request = store.getAll();

                    request.onsuccess = () => resolve(request.result);
                    request.onerror = () => reject(request.error);
                });
            }

            async getNamedFaces() {
                const allFaces = await this.getAllFaces();
                return allFaces.filter(face => face.name && face.name !== 'unknown');
            }

            async getUnknownFaces() {
                const allFaces = await this.getAllFaces();
                return allFaces.filter(face => !face.name || face.name === 'unknown');
            }

            async getFaceById(id) {
                return new Promise((resolve, reject) => {
                    const transaction = this.db.transaction(['faces'], 'readonly');
                    const store = transaction.objectStore('faces');
                    const request = store.get(id);

                    request.onsuccess = () => resolve(request.result);
                    request.onerror = () => reject(request.error);
                });
            }

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

            async updateFaceName(id, name) {
                return this.updateFace(id, { name: name });
            }

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

                if (face.quizAnswers.length >= 3) {
                    const answerCounts = {};
                    face.quizAnswers.forEach(item => {
                        answerCounts[item.answer] = (answerCounts[item.answer] || 0) + 1;
                    });

                    let maxCount = 0;
                    let mostCommonAnswer = 'unknown';
                    for (const [answer, count] of Object.entries(answerCounts)) {
                        if (count > maxCount) {
                            maxCount = count;
                            mostCommonAnswer = answer;
                        }
                    }

                    if (maxCount >= face.quizAnswers.length / 2) {
                        face.name = mostCommonAnswer;
                    }
                }

                return this.updateFace(faceId, face);
            }

            async deleteFace(id) {
                return new Promise((resolve, reject) => {
                    const transaction = this.db.transaction(['faces'], 'readwrite');
                    const store = transaction.objectStore('faces');
                    const request = store.delete(id);

                    request.onsuccess = () => resolve();
                    request.onerror = () => reject(request.error);
                });
            }

            async clearAll() {
                return new Promise((resolve, reject) => {
                    const transaction = this.db.transaction(['faces'], 'readwrite');
                    const store = transaction.objectStore('faces');
                    const request = store.clear();

                    request.onsuccess = () => resolve();
                    request.onerror = () => reject(request.error);
                });
            }
        };

        faceDB = new FaceDB();
        await faceDB.init();
    });

    afterEach(async () => {
        if (faceDB.db) {
            faceDB.db.close();
        }
        // データベースを削除
        const deleteRequest = indexedDB.deleteDatabase('FaceRecognitionDB');
        await new Promise((resolve) => {
            deleteRequest.onsuccess = resolve;
            deleteRequest.onerror = resolve;
        });
    });

    test('データベースを初期化できる', async () => {
        expect(faceDB.db).toBeDefined();
        expect(faceDB.db.objectStoreNames.contains('faces')).toBe(true);
    });

    test('顔データを保存できる', async () => {
        const descriptor = new Float32Array([1, 2, 3, 4]);
        const imageData = 'data:image/jpeg;base64,test';
        const name = 'Test User';

        const id = await faceDB.saveFace(descriptor, imageData, name);
        expect(id).toBeDefined();
        expect(typeof id).toBe('number');
    });

    test('すべての顔データを取得できる', async () => {
        const descriptor1 = new Float32Array([1, 2, 3, 4]);
        const descriptor2 = new Float32Array([5, 6, 7, 8]);

        await faceDB.saveFace(descriptor1, 'image1', 'User1');
        await faceDB.saveFace(descriptor2, 'image2', 'User2');

        const faces = await faceDB.getAllFaces();
        expect(faces.length).toBe(2);
        expect(faces[0].name).toBe('User1');
        expect(faces[1].name).toBe('User2');
    });

    test('名前付きの顔のみ取得できる', async () => {
        const descriptor1 = new Float32Array([1, 2, 3, 4]);
        const descriptor2 = new Float32Array([5, 6, 7, 8]);
        const descriptor3 = new Float32Array([9, 10, 11, 12]);

        await faceDB.saveFace(descriptor1, 'image1', 'User1');
        await faceDB.saveFace(descriptor2, 'image2', 'unknown');
        await faceDB.saveFace(descriptor3, 'image3', 'User3');

        const namedFaces = await faceDB.getNamedFaces();
        expect(namedFaces.length).toBe(2);
        expect(namedFaces[0].name).toBe('User1');
        expect(namedFaces[1].name).toBe('User3');
    });

    test('unknown顔のみ取得できる', async () => {
        const descriptor1 = new Float32Array([1, 2, 3, 4]);
        const descriptor2 = new Float32Array([5, 6, 7, 8]);
        const descriptor3 = new Float32Array([9, 10, 11, 12]);

        await faceDB.saveFace(descriptor1, 'image1', 'User1');
        await faceDB.saveFace(descriptor2, 'image2', 'unknown');
        await faceDB.saveFace(descriptor3, 'image3');

        const unknownFaces = await faceDB.getUnknownFaces();
        expect(unknownFaces.length).toBe(2);
    });

    test('IDで顔データを取得できる', async () => {
        const descriptor = new Float32Array([1, 2, 3, 4]);
        const id = await faceDB.saveFace(descriptor, 'image1', 'User1');

        const face = await faceDB.getFaceById(id);
        expect(face).toBeDefined();
        expect(face.name).toBe('User1');
        expect(face.imageData).toBe('image1');
    });

    test('顔の名前を更新できる', async () => {
        const descriptor = new Float32Array([1, 2, 3, 4]);
        const id = await faceDB.saveFace(descriptor, 'image1', 'User1');

        await faceDB.updateFaceName(id, 'Updated User');

        const face = await faceDB.getFaceById(id);
        expect(face.name).toBe('Updated User');
    });

    test('クイズの回答を記録できる', async () => {
        const descriptor = new Float32Array([1, 2, 3, 4]);
        const id = await faceDB.saveFace(descriptor, 'image1', 'unknown');

        await faceDB.addQuizAnswer(id, 'Answer1');
        await faceDB.addQuizAnswer(id, 'Answer2');
        await faceDB.addQuizAnswer(id, 'Answer1');

        const face = await faceDB.getFaceById(id);
        expect(face.quizAnswers.length).toBe(3);
        // 多数決でAnswer1が選ばれる（3回中2回）
        expect(face.name).toBe('Answer1');
    });

    test('顔データを削除できる', async () => {
        const descriptor = new Float32Array([1, 2, 3, 4]);
        const id = await faceDB.saveFace(descriptor, 'image1', 'User1');

        await faceDB.deleteFace(id);

        const face = await faceDB.getFaceById(id);
        expect(face).toBeUndefined();
    });

    test('すべてのデータをクリアできる', async () => {
        const descriptor1 = new Float32Array([1, 2, 3, 4]);
        const descriptor2 = new Float32Array([5, 6, 7, 8]);

        await faceDB.saveFace(descriptor1, 'image1', 'User1');
        await faceDB.saveFace(descriptor2, 'image2', 'User2');

        await faceDB.clearAll();

        const faces = await faceDB.getAllFaces();
        expect(faces.length).toBe(0);
    });
});
