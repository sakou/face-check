// 管理者用顔登録ページ

let video;
let canvas;
let statusEl;
let capturedListEl;
let captureBtnEl;
let clearBtnEl;
let registerSectionEl;
let nameInputEl;
let registerBtnEl;
let detectionInterval;
let capturedFaces = []; // キャプチャした顔データ
let currentDetections = []; // 現在検出中の顔

// 初期化
async function init() {
    video = document.getElementById('video');
    canvas = document.getElementById('overlay');
    statusEl = document.getElementById('status');
    capturedListEl = document.getElementById('capturedList');
    captureBtnEl = document.getElementById('captureBtn');
    clearBtnEl = document.getElementById('clearBtn');
    registerSectionEl = document.getElementById('registerSection');
    nameInputEl = document.getElementById('nameInput');
    registerBtnEl = document.getElementById('registerBtn');

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

        statusEl.textContent = '顔を検出中...';

        // ボタンを有効化
        captureBtnEl.disabled = false;

        // イベントリスナーを設定
        captureBtnEl.addEventListener('click', captureFaces);
        clearBtnEl.addEventListener('click', clearCaptured);
        registerBtnEl.addEventListener('click', registerFaces);

        // 顔検出を開始
        startDetection();

    } catch (error) {
        statusEl.textContent = 'エラー: ' + error.message;
        console.error(error);
    }
}

// 顔検出を開始
function startDetection() {
    detectionInterval = setInterval(async () => {
        try {
            const detections = await faceRecognition.detectFaces(video);
            currentDetections = detections;

            if (detections.length > 0) {
                // 検出結果を描画
                const labels = detections.map(() => '検出');
                faceRecognition.drawDetections(canvas, video, detections, labels);

                statusEl.textContent = `${detections.length}人の顔を検出中...`;
            } else {
                // 顔が検出されなかった場合はキャンバスをクリア
                canvas.getContext('2d').clearRect(0, 0, canvas.width, canvas.height);
                statusEl.textContent = '顔を検出中...';
            }
        } catch (error) {
            console.error('検出エラー:', error);
        }
    }, 200); // 200msごとに検出
}

// 顔をキャプチャ
async function captureFaces() {
    if (currentDetections.length === 0) {
        alert('顔が検出されていません');
        return;
    }

    captureBtnEl.disabled = true;

    try {
        for (const detection of currentDetections) {
            const descriptor = detection.descriptor;

            // 同じ人が既にキャプチャされているかチェック
            const isDuplicate = capturedFaces.some(face => {
                const distance = faceRecognition.compareFaces(descriptor, face.descriptor);
                return distance < 0.6; // 同一人物の閾値
            });

            if (!isDuplicate) {
                // 新しい人として追加
                const imageData = await faceRecognition.captureFaceImage(video, detection);

                capturedFaces.push({
                    descriptor: Array.from(descriptor),
                    imageData: imageData
                });
            }
        }

        renderCapturedFaces();

        // 登録セクションを表示
        if (capturedFaces.length > 0) {
            registerSectionEl.style.display = 'block';
        }

        statusEl.textContent = `${capturedFaces.length}人の顔をキャプチャしました`;

    } catch (error) {
        alert('キャプチャエラー: ' + error.message);
        console.error(error);
    } finally {
        captureBtnEl.disabled = false;
    }
}

// キャプチャした顔をクリア
function clearCaptured() {
    if (capturedFaces.length === 0) {
        return;
    }

    if (confirm('キャプチャした顔をすべてクリアしますか？')) {
        capturedFaces = [];
        renderCapturedFaces();
        registerSectionEl.style.display = 'none';
        nameInputEl.value = '';
        statusEl.textContent = '顔を検出中...';
    }
}

// キャプチャした顔を描画
function renderCapturedFaces() {
    capturedListEl.innerHTML = '';

    capturedFaces.forEach((face, index) => {
        const faceCard = document.createElement('div');
        faceCard.className = 'face-card';

        const img = document.createElement('img');
        img.src = face.imageData;
        img.alt = `Face ${index + 1}`;

        const removeBtn = document.createElement('button');
        removeBtn.textContent = '削除';
        removeBtn.className = 'btn btn-small';
        removeBtn.onclick = () => removeCapturedFace(index);

        faceCard.appendChild(img);
        faceCard.appendChild(removeBtn);

        capturedListEl.appendChild(faceCard);
    });
}

// キャプチャした顔を削除
function removeCapturedFace(index) {
    capturedFaces.splice(index, 1);
    renderCapturedFaces();

    if (capturedFaces.length === 0) {
        registerSectionEl.style.display = 'none';
        nameInputEl.value = '';
    }
}

// 顔を登録
async function registerFaces() {
    const name = nameInputEl.value.trim();

    if (!name) {
        alert('名前を入力してください');
        return;
    }

    if (capturedFaces.length === 0) {
        alert('キャプチャした顔がありません');
        return;
    }

    registerBtnEl.disabled = true;

    try {
        // すべてのキャプチャした顔を同じ名前で登録
        for (const face of capturedFaces) {
            await faceDB.saveFace(face.descriptor, face.imageData, name);
        }

        alert(`${capturedFaces.length}人の顔を「${name}」として登録しました`);

        // リセット
        capturedFaces = [];
        renderCapturedFaces();
        registerSectionEl.style.display = 'none';
        nameInputEl.value = '';
        statusEl.textContent = '顔を検出中...';

    } catch (error) {
        alert('登録エラー: ' + error.message);
        console.error(error);
    } finally {
        registerBtnEl.disabled = false;
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
