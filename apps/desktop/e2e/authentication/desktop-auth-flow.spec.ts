import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { expect, test } from '@playwright/test';
import { _electron as electron } from 'playwright';

test('production Electron exposes password + guest and enters an isolated guest profile', async () => {
  const runtimeRoot = fs.mkdtempSync(path.join(os.tmpdir(), 'memoflow-desktop-e2e-'));
  const userDataPath = path.join(runtimeRoot, 'user-data');
  const userFilesPath = path.join(runtimeRoot, 'user-files');
  const mainEntry = path.resolve('dist-electron/main.cjs');

  const electronApp = await electron.launch({
    args: [mainEntry],
    cwd: process.cwd(),
    env: {
      ...process.env,
      NODE_ENV: 'test',
      DAILYUSE_DESKTOP_USER_DATA_PATH: userDataPath,
      DAILYUSE_DESKTOP_USER_FILES_PATH: userFilesPath,
    },
  });
  electronApp.on('console', (message) => {
    console.log(`[electron-main:${message.type()}] ${message.text()}`);
  });

  try {
    const loginWindow = await electronApp.firstWindow();
    loginWindow.on('console', (message) => {
      console.log(`[electron-renderer:${message.type()}] ${message.text()}`);
    });
    await expect(loginWindow.getByTestId('desktop-login-email')).toBeVisible();
    await expect(loginWindow.getByTestId('desktop-login-password')).toBeVisible();
    await expect(loginWindow.getByTestId('guest-mode-button')).toBeVisible();

    const mainWindowPromise = electronApp.waitForEvent('window', {
      predicate: async (window) => {
        try {
          await window.getByTestId('app-shell').waitFor({ state: 'visible', timeout: 45_000 });
          return true;
        } catch {
          return false;
        }
      },
      timeout: 60_000,
    });
    await loginWindow.getByTestId('guest-mode-button').click();

    const mainWindow = await mainWindowPromise;
    await expect(mainWindow.getByTestId('app-shell')).toBeVisible();
  } finally {
    await electronApp.close();
    fs.rmSync(runtimeRoot, { recursive: true, force: true });
  }
});
