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

async function clickIfVisible(page: Page, selector: string): Promise<void> {
  const locator = page.locator(selector);
  if ((await locator.count()) > 0 && (await locator.first().isVisible())) {
    await locator.first().click();
  }
}

async function fillLoginForm(page: Page, credentials: SyncCredentials): Promise<void> {
  await clickIfVisible(page, '[data-testid="login-tab"]');

  const emailField = page.locator(
    '[data-testid="login-username-input"] input, [data-testid="login-username-input"]',
  );
  const passwordField = page.locator(
    '[data-testid="login-password-input"] input, [data-testid="login-password-input"]',
  );

  await emailField.first().fill(credentials.email);
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
        DAILYUSE_API_URL: this.apiBaseUrl,
        DAILYUSE_DESKTOP_USER_DATA_PATH: this.userDataDir,
        ELECTRON_DISABLE_SECURITY_WARNINGS: 'true',
        VITEST: 'true',
      },
    });

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
      .poll(async () => {
        const mainWindow = await this.findMainWindow();
        return mainWindow ? 'ready' : 'waiting';
      }, { timeout: 30_000, message: 'Timed out waiting for the desktop main window.' })
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
