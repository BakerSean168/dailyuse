import { existsSync, mkdirSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { expect, type Page } from '@playwright/test';
import { _electron as electron, type ElectronApplication } from 'playwright';
import type { SyncCredentials } from './credentials';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const workspaceRoot = path.resolve(__dirname, '..', '..', '..', '..', '..');
const desktopMainEntrypoint = path.join(
  workspaceRoot,
  'apps',
  'desktop',
  'dist-electron',
  'main.cjs',
);

async function clickIfVisible(page: Page, selector: string): Promise<boolean> {
  const locator = page.locator(selector);
  if (
    (await locator.count()) > 0 &&
    (await locator.first().isVisible()) &&
    (await locator.first().isEnabled())
  ) {
    await locator.first().click();
    return true;
  }

  return false;
}

async function fillLoginForm(page: Page, credentials: SyncCredentials): Promise<void> {
  await clickIfVisible(page, '[data-testid="login-tab"]');

  const quickLoginButton = page.getByTestId('desktop-quick-login-submit-button');
  const emailField = page.getByTestId('desktop-login-email');
  const passwordField = page.getByTestId('desktop-login-password');

  await expect
    .poll(
      async () => {
        if (page.isClosed()) return 'closed';
        if ((await quickLoginButton.count()) > 0 && (await quickLoginButton.first().isVisible())) {
          return 'quick-login';
        }
        if ((await passwordField.count()) > 0 && (await passwordField.first().isVisible())) {
          return 'password-login';
        }
        return 'waiting';
      },
      { timeout: 10_000, message: 'Timed out waiting for a Desktop authentication scene.' },
    )
    .not.toBe('waiting');

  if (page.isClosed()) {
    return;
  }

  if (await clickIfVisible(page, '[data-testid="desktop-quick-login-submit-button"]')) {
    const outcome = await Promise.race([
      passwordField
        .first()
        .waitFor({ state: 'visible', timeout: 10_000 })
        .then(() => 'password'),
      page.waitForEvent('close', { timeout: 10_000 }).then(() => 'closed'),
    ]).catch(() => 'waiting');

    if (outcome === 'closed' || page.isClosed()) {
      return;
    }

    if (outcome !== 'password') {
      throw new Error('Desktop quick login did not transition to password login or main window.');
    }
  }

  if ((await emailField.count()) > 0 && (await emailField.first().isVisible())) {
    await emailField.first().fill(credentials.email);
  }
  if ((await passwordField.count()) === 0 || !(await passwordField.first().isVisible())) {
    return;
  }

  await passwordField.first().fill(credentials.password);

  await page.getByTestId('login-submit-button').click();
}

export class DesktopAppController {
  private electronApp: ElectronApplication | null = null;
  private currentWindow: Page | null = null;

  constructor(
    private readonly userDataDir: string,
    private readonly apiBaseUrl: string,
  ) {}

  get page(): Page {
    if (!this.currentWindow) {
      throw new Error('Desktop window is not ready.');
    }

    return this.currentWindow;
  }

  async launch(): Promise<Page> {
    if (!existsSync(desktopMainEntrypoint)) {
      throw new Error(
        `Desktop entrypoint not found at ${desktopMainEntrypoint}. The sync global setup must build desktop first.`,
      );
    }

    // Each run gets an isolated user-data directory so sync assertions are not
    // polluted by a developer's local desktop session.
    mkdirSync(this.userDataDir, { recursive: true });

    this.electronApp = await electron.launch({
      args: [desktopMainEntrypoint],
      env: {
        ...process.env,
        MEMOFLOW_API_URL: this.apiBaseUrl,
        MEMOFLOW_DESKTOP_USER_DATA_PATH: this.userDataDir,
        ELECTRON_DISABLE_SECURITY_WARNINGS: 'true',
        VITEST: 'true',
      },
    });

    if (process.platform === 'linux') {
      // Headless Linux runners do not provide a Secret Service keyring. Keep
      // Electron's weaker basic_text backend confined to this isolated E2E
      // process so real login and encrypted-token restart flows remain testable.
      const encryptionAvailable = await this.electronApp.evaluate(({ safeStorage }) => {
        safeStorage.setUsePlainTextEncryption(true);
        return safeStorage.isEncryptionAvailable();
      });
      if (!encryptionAvailable) {
        throw new Error('Electron safeStorage is unavailable in the Linux E2E runtime.');
      }
    }

    this.currentWindow = await this.electronApp.firstWindow();
    await this.currentWindow.waitForLoadState('domcontentloaded');
    return this.currentWindow;
  }

  async ensureAuthenticated(credentials: SyncCredentials): Promise<Page> {
    if (!this.electronApp) {
      throw new Error('Electron app has not been launched.');
    }

    // Reuse the existing non-auth window when possible so restart logic and
    // repeated assertions do not re-submit the login form unnecessarily.
    const existingMainWindow = await this.findMainWindow();
    if (existingMainWindow) {
      this.currentWindow = existingMainWindow;
      return existingMainWindow;
    }

    const loginWindow = this.currentWindow ?? (await this.electronApp.firstWindow());
    await fillLoginForm(loginWindow, credentials);

    const mainWindow = await this.waitForMainWindow();
    this.currentWindow = mainWindow;
    return mainWindow;
  }

  async restart(credentials: SyncCredentials): Promise<Page> {
    await this.close();
    await this.launch();
    return this.ensureAuthenticated(credentials);
  }

  async setWindowSize(width: number, height: number): Promise<{ width: number; height: number }> {
    if (!this.electronApp) {
      throw new Error('Electron app has not been launched.');
    }

    return this.electronApp.evaluate(
      ({ BrowserWindow }, size) => {
        const window = BrowserWindow.getAllWindows().find((candidate) => !candidate.isDestroyed());
        if (!window) throw new Error('Desktop main window is unavailable.');
        window.setBounds({ width: size.width, height: size.height });
        const bounds = window.getBounds();
        return { width: bounds.width, height: bounds.height };
      },
      { width, height },
    );
  }

  async setZoomFactor(factor: number): Promise<void> {
    if (!this.electronApp) {
      throw new Error('Electron app has not been launched.');
    }

    await this.electronApp.evaluate(({ BrowserWindow }, zoomFactor) => {
      const window = BrowserWindow.getAllWindows().find((candidate) => !candidate.isDestroyed());
      if (!window) throw new Error('Desktop main window is unavailable.');
      window.webContents.setZoomFactor(zoomFactor);
    }, factor);
  }

  async close(): Promise<void> {
    if (!this.electronApp) {
      return;
    }

    await this.electronApp.close();
    this.electronApp = null;
    this.currentWindow = null;
  }

  private async waitForMainWindow(): Promise<Page> {
    await expect
      .poll(
        async () => {
          const mainWindow = await this.findMainWindow();
          return mainWindow ? 'ready' : 'waiting';
        },
        { timeout: 30_000, message: 'Timed out waiting for the desktop main window.' },
      )
      .toBe('ready');

    const mainWindow = await this.findMainWindow();
    if (!mainWindow) {
      throw new Error('Desktop main window never became available.');
    }

    await mainWindow.waitForLoadState('domcontentloaded');
    return mainWindow;
  }

  private async findMainWindow(): Promise<Page | null> {
    if (!this.electronApp) {
      return null;
    }

    for (const page of this.electronApp.windows()) {
      if (!(await this.isLoginWindow(page))) {
        return page;
      }
    }

    return null;
  }

  private async isLoginWindow(page: Page): Promise<boolean> {
    if (page.url().includes('#/auth')) {
      return true;
    }

    return (await page.getByTestId('login-submit-button').count()) > 0;
  }
}
