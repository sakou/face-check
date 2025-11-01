// テストのセットアップ

// structuredCloneのポリフィル（Node.js 17+で利用可能だが、Jest環境では未定義）
if (typeof global.structuredClone === 'undefined') {
    global.structuredClone = (obj) => {
        return JSON.parse(JSON.stringify(obj));
    };
}

// fake-indexeddbをインポート
const { indexedDB, IDBKeyRange } = require('fake-indexeddb');

// グローバルにIndexedDBをモック
global.indexedDB = indexedDB;
global.IDBKeyRange = IDBKeyRange;

// face-apiのモック
global.faceapi = {
    nets: {
        tinyFaceDetector: {
            loadFromUri: jest.fn().mockResolvedValue(true)
        },
        faceLandmark68Net: {
            loadFromUri: jest.fn().mockResolvedValue(true)
        },
        faceRecognitionNet: {
            loadFromUri: jest.fn().mockResolvedValue(true)
        }
    },
    TinyFaceDetectorOptions: jest.fn(),
    detectAllFaces: jest.fn(),
    detectSingleFace: jest.fn(),
    euclideanDistance: jest.fn(),
    matchDimensions: jest.fn(),
    resizeResults: jest.fn(),
    draw: {
        DrawBox: jest.fn()
    }
};

// カメラAPIのモック
const mockMediaStream = {
    getTracks: () => [
        {
            stop: jest.fn()
        }
    ]
};

global.navigator.mediaDevices = {
    getUserMedia: jest.fn().mockResolvedValue(mockMediaStream)
};

// HTMLVideoElementのモック
global.HTMLVideoElement.prototype.play = jest.fn();
global.HTMLVideoElement.prototype.pause = jest.fn();

// HTMLCanvasElementのモック
global.HTMLCanvasElement.prototype.getContext = jest.fn(() => ({
    clearRect: jest.fn(),
    drawImage: jest.fn(),
    fillRect: jest.fn(),
    strokeRect: jest.fn(),
    fillText: jest.fn()
}));

global.HTMLCanvasElement.prototype.toDataURL = jest.fn(() => 'data:image/jpeg;base64,mockImageData');

// confirmとalertのモック
global.confirm = jest.fn(() => true);
global.alert = jest.fn();

// コンソールのモック（エラー以外を非表示にする）
global.console = {
    ...console,
    log: jest.fn(),
    debug: jest.fn(),
    info: jest.fn(),
    warn: jest.fn()
};
