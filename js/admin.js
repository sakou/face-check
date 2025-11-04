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
let registeredListEl;
let refreshListBtnEl;
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
    registeredListEl = document.getElementById('registeredList');
    refreshListBtnEl = document.getElementById('refreshListBtn');

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
        refreshListBtnEl.addEventListener('click', loadRegisteredFaces);

        // 顔検出を開始
        startDetection();

        // 登録済み顔一覧を読み込み
        await loadRegisteredFaces();

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
                return distance < faceRecognition.DUPLICATE_THRESHOLD; // 同一人物の閾値
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

        // 登録済み顔一覧を更新
        await loadRegisteredFaces();

    } catch (error) {
        alert('登録エラー: ' + error.message);
        console.error(error);
    } finally {
        registerBtnEl.disabled = false;
    }
}

// 登録済み顔一覧を読み込み
async function loadRegisteredFaces() {
    try {
        const faces = await faceDB.getAllFaces();
        renderRegisteredFaces(faces);
    } catch (error) {
        console.error('顔一覧の読み込みエラー:', error);
        alert('顔一覧の読み込みに失敗しました');
    }
}

// 登録済み顔一覧を描画
function renderRegisteredFaces(faces) {
    registeredListEl.innerHTML = '';

    if (faces.length === 0) {
        registeredListEl.innerHTML = '<p>登録済みの顔がありません</p>';
        return;
    }

    faces.forEach((face) => {
        const faceCard = document.createElement('div');
        faceCard.className = 'face-card';

        const img = document.createElement('img');
        img.src = face.imageData;
        img.alt = face.name;

        const nameLabel = document.createElement('div');
        nameLabel.className = 'face-name';
        const descriptorCount = face.descriptors ? face.descriptors.length : 0;
        nameLabel.textContent = `${face.name} (${descriptorCount}角度)`;

        const buttonsContainer = document.createElement('div');
        buttonsContainer.className = 'face-buttons';

        const addAngleBtn = document.createElement('button');
        addAngleBtn.textContent = '角度追加';
        addAngleBtn.className = 'btn btn-small btn-info';
        addAngleBtn.onclick = () => addAngleToFace(face.id);

        const deleteBtn = document.createElement('button');
        deleteBtn.textContent = '削除';
        deleteBtn.className = 'btn btn-small btn-danger';
        deleteBtn.onclick = () => deleteRegisteredFace(face.id);

        buttonsContainer.appendChild(addAngleBtn);
        buttonsContainer.appendChild(deleteBtn);

        faceCard.appendChild(img);
        faceCard.appendChild(nameLabel);
        faceCard.appendChild(buttonsContainer);

        registeredListEl.appendChild(faceCard);
    });
}

// 既存の顔に新しい角度を追加
async function addAngleToFace(faceId) {
    if (currentDetections.length === 0) {
        alert('顔が検出されていません。カメラに顔を映してください。');
        return;
    }

    try {
        const face = await faceDB.getFaceById(faceId);
        if (!face) {
            alert('顔データが見つかりません');
            return;
        }

        const addedCount = currentDetections.length;

        // 検出された全ての顔を追加
        for (const detection of currentDetections) {
            const descriptor = detection.descriptor;
            await faceDB.addDescriptorToFace(faceId, descriptor);
        }

        await loadRegisteredFaces();
        alert(`「${face.name}」に${addedCount}個の新しい角度を追加しました`);
    } catch (error) {
        console.error('角度追加エラー:', error);
        alert('角度の追加に失敗しました: ' + error.message);
    }
}

// 登録済み顔を削除
async function deleteRegisteredFace(faceId) {
    if (!confirm('この顔を削除しますか？')) {
        return;
    }

    try {
        await faceDB.deleteFace(faceId);
        await loadRegisteredFaces();
        alert('顔を削除しました');
    } catch (error) {
        console.error('削除エラー:', error);
        alert('削除に失敗しました');
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
