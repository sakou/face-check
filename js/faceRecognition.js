// face-api.jsを使用した顔認識システム

class FaceRecognitionSystem {
    constructor() {
        this.modelsLoaded = false;
        this.MODEL_URL = 'https://cdn.jsdelivr.net/npm/@vladmandic/face-api/model/';
        this.MATCH_THRESHOLD = 0.45; // マッチング閾値（低いほど厳格） 0.6→0.45に変更
        this.DUPLICATE_THRESHOLD = 0.45; // 重複判定の閾値（管理者ページでの同一人物判定）
    }

    // モデルをロード
    async loadModels() {
        if (this.modelsLoaded) return;

        try {
            await Promise.all([
                faceapi.nets.tinyFaceDetector.loadFromUri(this.MODEL_URL),
                faceapi.nets.faceLandmark68Net.loadFromUri(this.MODEL_URL),
                faceapi.nets.faceRecognitionNet.loadFromUri(this.MODEL_URL)
            ]);
            this.modelsLoaded = true;
            console.log('顔認識モデルをロードしました');
        } catch (error) {
            console.error('モデルのロードに失敗:', error);
            throw error;
        }
    }

    // 顔を検出して特徴を抽出
    async detectFaces(input) {
        const detections = await faceapi
            .detectAllFaces(input, new faceapi.TinyFaceDetectorOptions())
            .withFaceLandmarks()
            .withFaceDescriptors();
        return detections;
    }

    // 単一の顔を検出
    async detectSingleFace(input) {
        const detection = await faceapi
            .detectSingleFace(input, new faceapi.TinyFaceDetectorOptions())
            .withFaceLandmarks()
            .withFaceDescriptor();
        return detection;
    }

    // 2つの顔の特徴を比較（距離が小さいほど似ている）
    compareFaces(descriptor1, descriptor2) {
        const d1 = Array.isArray(descriptor1) ? new Float32Array(descriptor1) : descriptor1;
        const d2 = Array.isArray(descriptor2) ? new Float32Array(descriptor2) : descriptor2;
        return faceapi.euclideanDistance(d1, d2);
    }

    // データベース内の顔とマッチング（複数角度対応）
    async matchFace(descriptor) {
        const faces = await faceDB.getAllFaces();

        let bestMatch = null;
        let bestDistance = Infinity;

        for (const face of faces) {
            // 複数のdescriptorsと比較し、最も近いものを使用
            const descriptors = face.descriptors || [];
            for (const faceDescriptor of descriptors) {
                const distance = this.compareFaces(descriptor, faceDescriptor);
                if (distance < bestDistance) {
                    bestDistance = distance;
                    bestMatch = face;
                }
            }
        }

        // 閾値以下なら一致とみなす
        if (bestDistance < this.MATCH_THRESHOLD) {
            return {
                match: bestMatch,
                distance: bestDistance,
                confidence: 1 - bestDistance
            };
        }

        return null;
    }

    // カスタム閾値でマッチング（unknown顔の統合用・複数角度対応）
    async matchFaceWithThreshold(descriptor, threshold) {
        const faces = await faceDB.getAllFaces();

        let bestMatch = null;
        let bestDistance = Infinity;

        for (const face of faces) {
            // 複数のdescriptorsと比較し、最も近いものを使用
            const descriptors = face.descriptors || [];
            for (const faceDescriptor of descriptors) {
                const distance = this.compareFaces(descriptor, faceDescriptor);
                if (distance < bestDistance) {
                    bestDistance = distance;
                    bestMatch = face;
                }
            }
        }

        // カスタム閾値以下なら一致とみなす
        if (bestDistance < threshold) {
            return {
                match: bestMatch,
                distance: bestDistance,
                confidence: 1 - bestDistance
            };
        }

        return null;
    }

    // 顔画像をキャプチャ
    async captureFaceImage(video, detection) {
        const canvas = document.createElement('canvas');
        const box = detection.detection.box;

        // 顔の周りに少し余白を持たせる
        const margin = 20;
        const x = Math.max(0, box.x - margin);
        const y = Math.max(0, box.y - margin);
        const width = Math.min(video.videoWidth - x, box.width + margin * 2);
        const height = Math.min(video.videoHeight - y, box.height + margin * 2);

        canvas.width = width;
        canvas.height = height;

        const ctx = canvas.getContext('2d');
        ctx.drawImage(video, x, y, width, height, 0, 0, width, height);

        return canvas.toDataURL('image/jpeg', 0.8);
    }

    // カメラストリームを開始
    async startCamera(videoElement) {
        try {
            const stream = await navigator.mediaDevices.getUserMedia({
                video: {
                    facingMode: 'user',
                    width: { ideal: 1280 },
                    height: { ideal: 720 }
                }
            });

            videoElement.srcObject = stream;

            return new Promise((resolve) => {
                videoElement.onloadedmetadata = () => {
                    resolve(stream);
                };
            });
        } catch (error) {
            console.error('カメラの起動に失敗:', error);
            throw new Error('カメラにアクセスできません。カメラの許可を確認してください。');
        }
    }

    // カメラストリームを停止
    stopCamera(videoElement) {
        if (videoElement.srcObject) {
            const tracks = videoElement.srcObject.getTracks();
            tracks.forEach(track => track.stop());
            videoElement.srcObject = null;
        }
    }

    // 検出結果をキャンバスに描画
    drawDetections(canvas, video, detections, labels = []) {
        const displaySize = { width: video.videoWidth, height: video.videoHeight };
        faceapi.matchDimensions(canvas, displaySize);

        const resizedDetections = faceapi.resizeResults(detections, displaySize);

        canvas.getContext('2d').clearRect(0, 0, canvas.width, canvas.height);

        // 顔の枠と名前を描画
        resizedDetections.forEach((detection, i) => {
            const box = detection.detection.box;
            const drawBox = new faceapi.draw.DrawBox(box, {
                label: labels[i] || 'unknown',
                boxColor: labels[i] && labels[i] !== 'unknown' ? '#00ff00' : '#ff0000'
            });
            drawBox.draw(canvas);
        });
    }
}

// グローバルインスタンスを作成
const faceRecognition = new FaceRecognitionSystem();
