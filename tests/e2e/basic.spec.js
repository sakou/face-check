// Playwright E2Eテスト

const { test, expect } = require('@playwright/test');

test.describe('顔認識アプリ E2Eテスト', () => {
    test('トップページが表示される', async ({ page }) => {
        await page.goto('/');

        await expect(page.locator('h1')).toContainText('顔認識アプリケーション');

        // メニュー項目が表示されることを確認
        await expect(page.locator('text=リアルタイム表示')).toBeVisible();
        await expect(page.locator('text=管理者用顔登録')).toBeVisible();
        await expect(page.locator('text=パブリック用クイズ')).toBeVisible();
    });

    test('リアルタイム表示ページに遷移できる', async ({ page }) => {
        await page.goto('/');

        // リアルタイム表示ページへ遷移
        await page.click('text=開く >> nth=0');

        await expect(page).toHaveURL(/.*realtime.html/);
        await expect(page.locator('h1')).toContainText('リアルタイム顔認識');
    });

    test('管理者用顔登録ページに遷移できる', async ({ page }) => {
        await page.goto('/');

        // 管理者用顔登録ページへ遷移
        await page.click('text=開く >> nth=1');

        await expect(page).toHaveURL(/.*admin.html/);
        await expect(page.locator('h1')).toContainText('管理者用顔登録');
    });

    test('パブリック用クイズページに遷移できる', async ({ page }) => {
        await page.goto('/');

        // パブリック用クイズページへ遷移
        await page.click('text=開く >> nth=2');

        await expect(page).toHaveURL(/.*quiz.html/);
        await expect(page.locator('h1')).toContainText('顔クイズ');
    });
});

test.describe('リアルタイム表示ページ', () => {
    test('カメラが起動する', async ({ page, context }) => {
        // カメラ権限を付与
        await context.grantPermissions(['camera']);

        await page.goto('/realtime.html');

        // ビデオ要素が表示されることを確認
        const video = page.locator('#video');
        await expect(video).toBeVisible();

        // ステータスメッセージを確認（初期化中→認識中）
        await page.waitForTimeout(3000); // モデルロード待機

        const status = page.locator('#status');
        // いずれかのステータスが表示されることを確認
        const statusText = await status.textContent();
        expect(
            statusText.includes('初期化中') ||
            statusText.includes('ロード中') ||
            statusText.includes('起動中') ||
            statusText.includes('認識中')
        ).toBeTruthy();
    });

    test('認識した顔一覧が表示される', async ({ page, context }) => {
        await context.grantPermissions(['camera']);
        await page.goto('/realtime.html');

        // 顔リストエリアが表示されることを確認
        const faceList = page.locator('#faceList');
        await expect(faceList).toBeVisible();
    });

    test('メニューに戻るボタンが機能する', async ({ page }) => {
        await page.goto('/realtime.html');

        await page.click('text=メニューに戻る');

        await expect(page).toHaveURL(/.*index.html/);
    });
});

test.describe('管理者用顔登録ページ', () => {
    test('キャプチャボタンが存在する', async ({ page, context }) => {
        await context.grantPermissions(['camera']);
        await page.goto('/admin.html');

        // キャプチャボタンが表示されることを確認
        await page.waitForSelector('#captureBtn', { timeout: 5000 });
        const captureBtn = page.locator('#captureBtn');
        await expect(captureBtn).toBeVisible();
    });

    test('クリアボタンが機能する', async ({ page, context }) => {
        await context.grantPermissions(['camera']);
        await page.goto('/admin.html');

        const clearBtn = page.locator('#clearBtn');
        await expect(clearBtn).toBeVisible();

        // クリックできることを確認
        await clearBtn.click();
    });
});

test.describe('パブリック用クイズページ', () => {
    test('クイズページが表示される', async ({ page }) => {
        await page.goto('/quiz.html');

        // クイズコンテナが表示されることを確認
        const quizContainer = page.locator('.quiz-container');
        await expect(quizContainer).toBeVisible();
    });

    test('クイズが利用できない場合のメッセージが表示される', async ({ page }) => {
        await page.goto('/quiz.html');

        // データがない場合のメッセージを確認
        await page.waitForTimeout(2000);

        // クイズセクションまたは「利用できない」メッセージのいずれかが表示される
        const quizSection = page.locator('#quizSection');
        const noQuizMsg = page.locator('#noQuizAvailable');

        const quizVisible = await quizSection.isVisible();
        const noQuizVisible = await noQuizMsg.isVisible();

        expect(quizVisible || noQuizVisible).toBeTruthy();
    });
});

test.describe('レスポンシブデザイン', () => {
    test('モバイルビューで正しく表示される', async ({ page }) => {
        await page.setViewportSize({ width: 375, height: 667 }); // iPhone SE サイズ

        await page.goto('/');

        // メニューが表示されることを確認
        await expect(page.locator('h1')).toBeVisible();
        await expect(page.locator('.menu')).toBeVisible();
    });

    test('タブレットビューで正しく表示される', async ({ page }) => {
        await page.setViewportSize({ width: 768, height: 1024 }); // iPad サイズ

        await page.goto('/');

        await expect(page.locator('h1')).toBeVisible();
        await expect(page.locator('.menu')).toBeVisible();
    });
});
