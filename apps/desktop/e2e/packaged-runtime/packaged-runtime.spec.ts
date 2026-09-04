import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { expect, test } from '@playwright/test';
import { _electron as electron, type ElectronApplication } from 'playwright';

function appendLog(logs: string[], source: string, value: unknown): void {
  logs.push(`[${source}] ${typeof value === 'string' ? value : String(value)}`);
}

function readRuntimeLogs(userDataPath: string): string[] {
  const logDir = path.join(userDataPath, 'logs');
  if (!fs.existsSync(logDir)) return [];
  return fs
    .readdirSync(logDir)
    .filter((name) => name.endsWith('.log'))
    .sort()
    .flatMap((name) => {
      try {
        const content = fs.readFileSync(path.join(logDir, name), 'utf8');
        return [`[file:user-data/logs/${name}]\n${content.slice(-32_000)}`];
      } catch (error) {
        return [`[file-error:${name}] ${String(error)}`];
      }
    });
}

const executablePath = process.env.MEMOFLOW_PACKAGED_EXECUTABLE;

test('packaged MemoFlow boots through renderer readiness', async ({}, testInfo) => {
  expect(executablePath, 'MEMOFLOW_PACKAGED_EXECUTABLE must point to a packaged executable').toBeTruthy();
  expect(fs.existsSync(executablePath!), `packaged executable does not exist: ${executablePath}`).toBe(true);

  const runtimeRoot = fs.mkdtempSync(path.join(os.tmpdir(), 'memoflow-packaged-smoke-'));
  const userDataPath = path.join(runtimeRoot, 'user-data');
  const userFilesPath = path.join(runtimeRoot, 'user-files');
  const logs: string[] = [];
  const rendererPageErrors: string[] = [];
  let electronApp: ElectronApplication | null = null;
  let testFailure: unknown = null;
  let closeFailure: unknown = null;

  try {
    const args = ['--disable-gpu', '--disable-dev-shm-usage'];
    if (process.platform === 'linux' && process.env.MEMOFLOW_PACKAGED_USE_GNOME_KEYRING === '1') {
      args.push('--password-store=gnome-libsecret');
    }

    electronApp = await electron.launch({
      executablePath,
      args,
      env: {
        ...process.env,
        MEMOFLOW_DESKTOP_USER_DATA_PATH: userDataPath,
        MEMOFLOW_DESKTOP_USER_FILES_PATH: userFilesPath,
        ELECTRON_DISABLE_SECURITY_WARNINGS: 'true',
      },
    });
    electronApp.on('console', (message) => appendLog(logs, `main:${message.type()}`, message.text()));
    electronApp.process().stdout?.on('data', (chunk) => appendLog(logs, 'stdout', chunk.toString()));
    electronApp.process().stderr?.on('data', (chunk) => appendLog(logs, 'stderr', chunk.toString()));

    const mainWindow = await electronApp.firstWindow({ timeout: 45_000 });
    mainWindow.on('console', (message) => appendLog(logs, `renderer:${message.type()}`, message.text()));
    mainWindow.on('pageerror', (error) => {
      rendererPageErrors.push(error.message);
      appendLog(logs, 'renderer:pageerror', error.stack ?? error.message);
    });

    await expect(mainWindow.getByTestId('app-shell')).toBeVisible({ timeout: 45_000 });

    const windowHeader = mainWindow.getByTestId('window-header');
    await expect(windowHeader).toBeVisible();
    const headerAppRegion = await windowHeader.evaluate((element) =>
      getComputedStyle(element).getPropertyValue('-webkit-app-region').trim(),
    );
    expect(headerAppRegion, 'packaged Desktop titlebar must remain a native drag region').toBe('drag');

    const rightPanelToggle = mainWindow.getByTestId('shell-right-panel-toggle');
    await expect(rightPanelToggle).toBeVisible();
    const controlAppRegion = await rightPanelToggle.evaluate((element) =>
      getComputedStyle(element).getPropertyValue('-webkit-app-region').trim(),
    );
    expect(controlAppRegion, 'interactive titlebar controls must opt out of native dragging').toBe(
      'no-drag',
    );

    // Shared account settings must only mount password management when the host
    // provides the full CloudAuthClientPort (AUTH_SERVICE_KEY). Desktop exposes
    // a narrower session/device-auth port and must degrade without crashing.
    await mainWindow.getByTestId('shell-account-menu').click();
    const openAccount = mainWindow.getByTestId('shell-open-account');
    await expect(openAccount).toBeVisible();
    await openAccount.click();
    await expect(mainWindow.getByTestId('standalone-settings-layout')).toBeVisible({ timeout: 15_000 });
    await expect(mainWindow.getByTestId('settings-tab-account')).toBeVisible();
    await expect(mainWindow.getByTestId('account-center-view')).toBeVisible();
    expect(
      rendererPageErrors.filter((message) => message.includes('Missing injection: AuthService')),
      'Desktop account/privacy settings must not mount Web-only password auth without the capability',
    ).toEqual([]);
  } catch (error) {
    testFailure = error;
    appendLog(logs, 'smoke-error', error instanceof Error ? (error.stack ?? error.message) : error);
    throw error;
  } finally {
    logs.push(...readRuntimeLogs(userDataPath));
    if (electronApp) {
      try {
        await electronApp.close();
      } catch (error) {
        closeFailure = error;
        appendLog(logs, 'close-error', error instanceof Error ? (error.stack ?? error.message) : error);
      }
    }
    await testInfo.attach('packaged-runtime.log', {
      body: Buffer.from(`${logs.join('\n')}\n`, 'utf8'),
      contentType: 'text/plain',
    });
    fs.rmSync(runtimeRoot, { recursive: true, force: true });
  }

  if (!testFailure && closeFailure) throw closeFailure;
});
