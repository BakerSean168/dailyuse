/**
 * Application Lifecycle Management
 *
 * Manages the complete lifecycle of the Electron application:
 * - app.whenReady() - Application ready, create window
 * - app.on('activate') - macOS reactivate
 * - app.on('window-all-closed') - All windows closed
 * - app.on('before-quit') - Cleanup before exit
 *
 * 登录流程（Steam-like）：
 * 1. 检查是否有启用自动登录的账号
 * 2. 有 → 检查 Session 是否有效 → 有效则直接进入主窗口
 * 3. 无自动登录 → 显示登录窗口（支持快速登录已保存账号）
 *
 * @module lifecycle/app-lifecycle
 */

import { app, BrowserWindow } from 'electron';
import path from 'path';
import { fileURLToPath } from 'url';
import { initializeDesktopFeatures, cleanupDesktopFeatures } from '../desktop-features';
import { registerSystemIpcHandlers } from '../ipc/system-handlers';
import { initNotificationService } from '../services';
import { shutdownPowerSync } from '../database/powersync';
import { getBootstrapper } from '../main';
import { getWindowManager } from './WindowManager';
import { createNativeWindowChromeOptions } from './desktopChrome';
import { getTokenManager } from '../modules/authentication/infrastructure';
import { getRememberedAccountsService } from '../modules/authentication/infrastructure';
import { getDesktopAuthService } from '../auth/desktop-auth-context';
import { resolvePreloadPath } from '../utils/resolve-preload-path';
import { startScheduleRuntime, stopScheduleRuntime } from '@dailyuse/schedule/electron-entry';

// ESM compatibility for __dirname
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

let mainWindow: BrowserWindow | null = null;

/**
 * Creates the main application window.
 *
 * Configures window dimensions, web preferences, preload script, and title bar style.
 * In development, loads the Vite dev server URL.
 * In production, loads the bundled index.html.
 *
 * @returns {BrowserWindow} The created BrowserWindow instance.
 */
export function createMainWindow(): BrowserWindow {
  // Resolve preload script path correctly in both dev and production
  const preloadPath = resolvePreloadPath(__dirname);

  mainWindow = new BrowserWindow({
    width: 1200,
    height: 800,
    minWidth: 800,
    minHeight: 600,
    ...createNativeWindowChromeOptions(),
    webPreferences: {
      preload: preloadPath,
      contextIsolation: true,
      nodeIntegration: false,
      sandbox: false,
    },
    show: false,
  });

  mainWindow.setMenuBarVisibility(false);
  mainWindow.removeMenu();

  // Show window only when ready to avoid white screen
  mainWindow.once('ready-to-show', () => {
    mainWindow?.show();
  });

  // Load application
  if (process.env.NODE_ENV === 'development') {
    // Development mode: Load Vite dev server
    const devServerUrl = process.env.VITE_DEV_SERVER_URL || 'http://localhost:5173';
    mainWindow.loadURL(devServerUrl);
    mainWindow.webContents.openDevTools();
  } else {
    // Production mode: Load bundled HTML
    mainWindow.loadFile(path.join(__dirname, '../renderer/index.html'));
  }

  mainWindow.on('closed', () => {
    mainWindow = null;
  });

  return mainWindow;
}

/**
 * Retrieves the main application window instance.
 *
 * @returns {BrowserWindow | null} The main BrowserWindow instance, or null if it's not created or closed.
 */
export function getMainWindow(): BrowserWindow | null {
  return mainWindow;
}

/**
 * Handles the application 'ready' event.
 *
 * 登录流程（Steam-like）：
 * 1. 检查是否有启用自动登录的账号
 * 2. 有 → 检查 Session 是否有效 → 有效则直接进入主窗口
 * 3. 无自动登录 → 显示登录窗口（支持快速登录已保存账号）
 *
 * @param {() => Promise<void>} initializeApp - The application initialization function to be called.
 * @returns {Promise<void>} A promise that resolves when initialization is complete.
 */
async function handleAppReady(initializeApp: () => Promise<void>): Promise<void> {
  // Application core initialization
  await initializeApp();

  // Register system IPC handlers BEFORE creating window
  registerSystemIpcHandlers(null, null, null);
  console.log('[Lifecycle] System IPC handlers registered (initial)');

  // 决定显示哪个窗口
  const windowManager = getWindowManager();
  const tokenManager = getTokenManager();
  const rememberedAccounts = getRememberedAccountsService();
  const authService = getDesktopAuthService();
  const rememberedAccountList = await rememberedAccounts.list();
  const quickLoginAccounts = rememberedAccountList.map((account) => ({
    id: account.identityId,
    username: account.nickname || account.identifier,
    email: account.identifier,
    avatarUrl: account.avatarUrl ?? undefined,
    lastLoginAt: account.lastLoginAt,
  }));

  // 只有用户明确启用了自动登录，才尝试自动恢复主进程会话
  const autoLoginAccount = await rememberedAccounts.getAutoLoginAccount();
  const tokenStatus = autoLoginAccount ? await tokenManager.getStatus() : null;
  let shouldShowMainWindow = false;

  if (autoLoginAccount && tokenStatus?.hasValidToken) {
    console.log('[Lifecycle] Auto-login account found, restoring desktop auth session');
    await authService.initialize();
    const autoLoginResult = await authService.autoLogin();
    shouldShowMainWindow = autoLoginResult.authenticated;
  }

  let win: BrowserWindow;

  if (shouldShowMainWindow) {
    // PowerSync is already initialized by authService.initialize() →
    // initializePowerSyncAsync(), which handles online/offline modes.
    // No need to call connectPowerSync()/openPowerSyncLocalOnly() here.

    // 直接进入主窗口
    win = windowManager.createMainWindow();
    mainWindow = win;
    startScheduleRuntime();
    console.log('[Lifecycle] Created main window (auto-login)');
  } else {
    // 显示登录窗口
    stopScheduleRuntime();
    win = windowManager.createLoginWindow({
      hasQuickLoginAccounts: quickLoginAccounts.length > 0,
      quickLoginAccounts,
    });
    console.log('[Lifecycle] Created login window');
  }

  // Initialize notification service (requires window to be created)
  if (win) {
    initNotificationService(win);
    console.log('[Lifecycle] Notification service initialized');

    // Initialize desktop features
    await initializeDesktopFeatures(win);

    // Update system handlers with desktop feature managers
    // Note: Handlers that need these managers will get them lazily
    console.log('[Lifecycle] Desktop features initialized');
  }

  // macOS: Re-create window when dock icon is clicked
  app.on('activate', async () => {
    if (BrowserWindow.getAllWindows().length === 0) {
      const accounts = await rememberedAccounts.list();
      getWindowManager().createLoginWindow({
        hasQuickLoginAccounts: accounts.length > 0,
        quickLoginAccounts: accounts.map((account) => ({
          id: account.identityId,
          username: account.nickname || account.identifier,
          email: account.identifier,
          avatarUrl: account.avatarUrl ?? undefined,
          lastLoginAt: account.lastLoginAt,
        })),
      });
    }
  });
}

/**
 * Handles the 'window-all-closed' event.
 *
 * On macOS, the application stays active until explicitly quit.
 * On other platforms, the application quits.
 */
function handleWindowAllClosed(): void {
  // macOS: Keep application active until explicitly quit
  if (process.platform !== 'darwin') {
    app.quit();
  }
}

/**
 * Handles the 'before-quit' event.
 *
 * Performs cleanup tasks such as cleaning up desktop features,
 * shutting down modules, and shutting down the PowerSync runtime.
 *
 * @returns {Promise<void>} A promise that resolves when cleanup is complete.
 */
async function handleBeforeQuit(): Promise<void> {
  console.log('[Lifecycle] Cleaning up before quit...');

  // Gracefully shut down PowerSync (preserves local sync cache for next cold start).
  // On logout, disconnectPowerSync() is called instead, which wipes the data.
  await shutdownPowerSync().catch((err) =>
    console.error('[Lifecycle] PowerSync shutdown failed during quit:', err),
  );

  // Cleanup desktop feature resources
  await cleanupDesktopFeatures();

  // Shutdown all modules via bootstrapper (graceful shutdown)
  const bootstrapper = getBootstrapper();
  if (bootstrapper) {
    await bootstrapper.destroy();
  }

  console.log('[Lifecycle] Cleanup complete');
}

/**
 * Sets up security handlers to prevent unwanted window creation.
 *
 * Denies all new window requests from web contents.
 */
function setupSecurityHandlers(): void {
  app.on('web-contents-created', (_, contents) => {
    contents.setWindowOpenHandler(() => ({ action: 'deny' }));
  });
}

/**
 * Registers all application lifecycle event handlers.
 *
 * Sets up handlers for 'ready', 'window-all-closed', 'before-quit' events,
 * and configures security policies.
 *
 * @param {() => Promise<void>} initializeApp - The function to initialize the application logic.
 */
export function registerAppLifecycleHandlers(initializeApp: () => Promise<void>): void {
  // Create window when application is ready
  app.whenReady().then(() => handleAppReady(initializeApp));

  // Handle all windows closed
  app.on('window-all-closed', handleWindowAllClosed);

  // Cleanup before quit
  app.on('before-quit', () => handleBeforeQuit());

  // Set security handlers
  setupSecurityHandlers();
}
