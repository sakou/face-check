// リアルタイム顔認識ページ

const MAX_DISPLAY_FACES = 20; // 最大表示人数

let video;
let canvas;
let statusEl;
let faceListEl;
let detectionInterval;
let displayedFaces = []; // 表示中の顔（最大20人）

// 初期化
async function init() {
    video = document.getElementById('video');
    canvas = document.getElementById('overlay');
    statusEl = document.getElementById('status');
    faceListEl = document.getElementById('faceList');

    try {
        statusEl.textContent = 'データベースを初期化中...';
        await faceDB.init();

        statusEl.textContent = '顔認識モデルをロード中...';
        await faceRecognition.loadModels();

        statusEl.textContent = 'カメラを起動中...';
        await faceRecognition.startCamera(video);

        // キャンバスのサイズを設定
        canvas.width = video.videoWidth;
        canvas.height = video.videoHeight;

        statusEl.textContent = '認識中...';

        // 既存のデータをロード
        await loadExistingFaces();

        // 顔認識を開始
        startDetection();

    } catch (error) {
        statusEl.textContent = 'エラー: ' + error.message;
        console.error(error);
    }
}

// 既存の顔データをロード
async function loadExistingFaces() {
    const faces = await faceDB.getAllFaces();

    // タイムスタンプでソート（新しい順）
    faces.sort((a, b) => b.timestamp - a.timestamp);

    // 最新20人を表示
    displayedFaces = faces.slice(0, MAX_DISPLAY_FACES);

    renderFaceList();
}

// 顔認識を開始
function startDetection() {
    detectionInterval = setInterval(async () => {
        try {
            const detections = await faceRecognition.detectFaces(video);

            if (detections.length > 0) {
                const labels = [];

                for (const detection of detections) {
                    const descriptor = detection.descriptor;

                    // 既存の顔とマッチング（厳格な閾値）
                    const match = await faceRecognition.matchFace(descriptor);

                    if (match) {
                        // 既知の顔
                        const confidence = Math.round((1 - match.distance) * 100);
                        labels.push(`${match.match.name || 'unknown'} (${confidence}%)`);

                        // 表示リストを更新（信頼度付き）
                        updateDisplayedFaces(match.match, confidence);
                    } else {
                        // 厳格な閾値でマッチしなかった場合、緩い閾値で再度チェック
                        // これにより、同じ人のunknownが複数作成されるのを防ぐ
                        const looseMatch = await faceRecognition.matchFaceWithThreshold(descriptor, 0.55);

                        if (looseMatch) {
                            // 既存のunknownにマッチした
                            const confidence = Math.round((1 - looseMatch.distance) * 100);
                            labels.push(`${looseMatch.match.name || 'unknown'} (${confidence}%)`);
                            updateDisplayedFaces(looseMatch.match, confidence);
                        } else {
                            // 完全に新しい顔を保存
                            const imageData = await faceRecognition.captureFaceImage(video, detection);
                            const faceId = await faceDB.saveFace(descriptor, imageData);

                            // 新しい顔を取得
                            const newFace = await faceDB.getFaceById(faceId);

                            // 表示リストに追加
                            addToDisplayedFaces(newFace, 0);

                            labels.push('unknown (新規)');
                        }
                    }
                }

                // 検出結果を描画
                faceRecognition.drawDetections(canvas, video, detections, labels);
            } else {
                // 顔が検出されなかった場合はキャンバスをクリア
                canvas.getContext('2d').clearRect(0, 0, canvas.width, canvas.height);
            }
        } catch (error) {
            console.error('検出エラー:', error);
        }
    }, 500); // 500msごとに検出
}

// 表示リストに顔を追加（20人制限）
function addToDisplayedFaces(face, confidence = 0) {
    // 既に表示リストにあるかチェック
    const existingIndex = displayedFaces.findIndex(f => f.id === face.id);
    if (existingIndex !== -1) {
        return;
    }

    // 信頼度スコアを追加
    const faceWithConfidence = { ...face, confidence };

    // リストの先頭に追加
    displayedFaces.unshift(faceWithConfidence);

    // 20人を超えたら古いものを削除
    if (displayedFaces.length > MAX_DISPLAY_FACES) {
        displayedFaces.pop();
    }

    renderFaceList();
}

// 表示リストを更新（既存の顔を前に持ってくる）
function updateDisplayedFaces(face, confidence = 0) {
    const existingIndex = displayedFaces.findIndex(f => f.id === face.id);

    // 信頼度スコアを追加
    const faceWithConfidence = { ...face, confidence };

    if (existingIndex !== -1) {
        // 既に表示されている場合は、リストの先頭に移動
        displayedFaces.splice(existingIndex, 1);
        displayedFaces.unshift(faceWithConfidence);
    } else {
        // 表示されていない場合は追加
        addToDisplayedFaces(face, confidence);
    }

    renderFaceList();
}

// 顔リストを描画
function renderFaceList() {
    faceListEl.innerHTML = '';

    displayedFaces.forEach(face => {
        const faceCard = document.createElement('div');
        faceCard.className = 'face-card';

        const img = document.createElement('img');
        img.src = face.imageData;
        img.alt = face.name || 'unknown';

        const nameEl = document.createElement('div');
        nameEl.className = 'face-name';

        // 信頼度スコアを表示
        const confidenceText = face.confidence > 0 ? ` (${face.confidence}%)` : '';
        const confidenceColor = getConfidenceColor(face.confidence);
        nameEl.innerHTML = `${face.name || 'unknown'}<span style="color: ${confidenceColor}; font-size: 0.9em;">${confidenceText}</span>`;

        const buttonsEl = document.createElement('div');
        buttonsEl.className = 'face-buttons';

        // ◯ボタン（正しい認識）
        const correctBtn = document.createElement('button');
        correctBtn.textContent = '◯';
        correctBtn.className = 'btn-correct';
        correctBtn.title = '正しい認識';
        correctBtn.onclick = () => handleCorrect(face.id);

        // ×ボタン（誤った認識）
        const incorrectBtn = document.createElement('button');
        incorrectBtn.textContent = '✕';
        incorrectBtn.className = 'btn-incorrect';
        incorrectBtn.title = '誤った認識';
        incorrectBtn.onclick = () => handleIncorrect(face.id);

        buttonsEl.appendChild(correctBtn);
        buttonsEl.appendChild(incorrectBtn);

        faceCard.appendChild(img);
        faceCard.appendChild(nameEl);
        faceCard.appendChild(buttonsEl);

        faceListEl.appendChild(faceCard);
    });
}

// 信頼度スコアに応じた色を返す
function getConfidenceColor(confidence) {
    if (confidence >= 70) {
        return '#00ff00'; // 緑 - 高い信頼度
    } else if (confidence >= 50) {
        return '#ffff00'; // 黄色 - 中程度の信頼度
    } else if (confidence > 0) {
        return '#ff6600'; // オレンジ - 低い信頼度
    } else {
        return '#ffffff'; // 白 - 新規
    }
}

// 正しい認識の処理
function handleCorrect(faceId) {
    // 特に何もしない（フィードバックのみ）
    console.log('正しい認識として記録:', faceId);
}

// 誤った認識の処理（名前をリセット）
async function handleIncorrect(faceId) {
    if (confirm('この認識をリセットしますか？名前が「unknown」に戻ります。')) {
        try {
            await faceDB.updateFaceName(faceId, 'unknown');

            // 表示リストを更新
            const face = await faceDB.getFaceById(faceId);
            const index = displayedFaces.findIndex(f => f.id === faceId);
            if (index !== -1) {
                displayedFaces[index] = face;
                renderFaceList();
            }

            alert('名前をリセットしました');
        } catch (error) {
            alert('エラー: ' + error.message);
        }
    }
}

// ページを離れるときにカメラを停止
window.addEventListener('beforeunload', () => {
    if (detectionInterval) {
        clearInterval(detectionInterval);
    }
    if (video) {
        faceRecognition.stopCamera(video);
    }
});

// 初期化を実行
init();
