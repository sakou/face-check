// パブリック用クイズページ

let statusEl;
let quizSectionEl;
let quizFaceImageEl;
let answerInputEl;
let submitAnswerEl;
let skipBtnEl;
let answeredCountEl;
let noQuizAvailableEl;

let unknownFaces = [];
let currentFace = null;
let answeredCount = 0;

// 初期化
async function init() {
    statusEl = document.getElementById('status');
    quizSectionEl = document.getElementById('quizSection');
    quizFaceImageEl = document.getElementById('quizFaceImage');
    answerInputEl = document.getElementById('answerInput');
    submitAnswerEl = document.getElementById('submitAnswer');
    skipBtnEl = document.getElementById('skipBtn');
    answeredCountEl = document.getElementById('answeredCount');
    noQuizAvailableEl = document.getElementById('noQuizAvailable');

    try {
        statusEl.textContent = 'データベースを初期化中...';
        await faceDB.init();

        statusEl.textContent = 'クイズを準備中...';

        // イベントリスナーを設定
        submitAnswerEl.addEventListener('click', submitAnswer);
        skipBtnEl.addEventListener('click', skipQuestion);

        // Enterキーで送信
        answerInputEl.addEventListener('keypress', (e) => {
            if (e.key === 'Enter') {
                submitAnswer();
            }
        });

        // unknown顔を取得
        await loadUnknownFaces();

        if (unknownFaces.length === 0) {
            showNoQuizAvailable();
        } else {
            showNextQuestion();
        }

    } catch (error) {
        statusEl.textContent = 'エラー: ' + error.message;
        console.error(error);
    }
}

// unknown顔を取得
async function loadUnknownFaces() {
    unknownFaces = await faceDB.getUnknownFaces();
}

// 次の問題を表示
function showNextQuestion() {
    if (unknownFaces.length === 0) {
        showNoQuizAvailable();
        return;
    }

    // ランダムに顔を選択
    const randomIndex = Math.floor(Math.random() * unknownFaces.length);
    currentFace = unknownFaces[randomIndex];

    // 画像を表示
    quizFaceImageEl.src = currentFace.imageData;

    // 入力をクリア
    answerInputEl.value = '';

    // クイズセクションを表示
    statusEl.style.display = 'none';
    quizSectionEl.style.display = 'block';
    noQuizAvailableEl.style.display = 'none';

    // 入力欄にフォーカス
    answerInputEl.focus();
}

// クイズが利用できない場合の表示
function showNoQuizAvailable() {
    statusEl.style.display = 'none';
    quizSectionEl.style.display = 'none';
    noQuizAvailableEl.style.display = 'block';
}

// 回答を送信
async function submitAnswer() {
    const answer = answerInputEl.value.trim();

    if (!answer) {
        alert('名前を入力してください');
        return;
    }

    if (!currentFace) {
        return;
    }

    submitAnswerEl.disabled = true;

    try {
        // 回答を記録
        await faceDB.addQuizAnswer(currentFace.id, answer);

        answeredCount++;
        answeredCountEl.textContent = answeredCount;

        // 顔データを更新（名前が確定したかもしれない）
        const updatedFace = await faceDB.getFaceById(currentFace.id);

        if (updatedFace.name !== 'unknown') {
            // 名前が確定したので、リストから削除
            unknownFaces = unknownFaces.filter(f => f.id !== currentFace.id);
            alert(`「${updatedFace.name}」として学習しました！`);
        }

        // 次の問題へ
        setTimeout(() => {
            showNextQuestion();
        }, 500);

    } catch (error) {
        alert('エラー: ' + error.message);
        console.error(error);
    } finally {
        submitAnswerEl.disabled = false;
    }
}

// 問題をスキップ
function skipQuestion() {
    // 次の問題へ
    showNextQuestion();
}

// 初期化を実行
init();
