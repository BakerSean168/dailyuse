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
    args: [mainEntry, '--disable-gpu', '--disable-dev-shm-usage'],
    cwd: process.cwd(),
    env: {
      ...process.env,
      NODE_ENV: 'test',
      MEMOFLOW_DESKTOP_USER_DATA_PATH: userDataPath,
      MEMOFLOW_DESKTOP_USER_FILES_PATH: userFilesPath,
      ELECTRON_DISABLE_SECURITY_WARNINGS: 'true',
    },
  });
  electronApp.on('console', (message) => {
    console.log(`[electron-main:${message.type()}] ${message.text()}`);
  });

  try {
    // Residual 1333: headless Linux CI/agent hosts have no Secret Service keyring.
    // Enable Electron's basic_text backend for this disposable E2E process only
    // (same shipped path as apps/web/e2e/sync/helpers/desktop.ts).
    if (process.platform === 'linux') {
      const encryptionAvailable = await electronApp.evaluate(({ safeStorage }) => {
        safeStorage.setUsePlainTextEncryption(true);
        return safeStorage.isEncryptionAvailable();
      });
      if (!encryptionAvailable) {
        throw new Error('Electron safeStorage is unavailable in the Linux E2E runtime.');
      }
    }

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
