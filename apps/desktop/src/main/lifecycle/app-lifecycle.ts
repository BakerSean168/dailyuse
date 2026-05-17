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
 * 1. 检查是否存在已记住账号
 * 2. 始终先显示登录窗口
 * 3. 登录窗口内部根据 remembered account / auto-login 状态决定交互
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
import { getRememberedAccountsService } from '../modules/authentication/infrastructure';
import { resolvePreloadPath } from '../utils/resolve-preload-path';
import { stopScheduleRuntime } from '@dailyuse/schedule/electron-entry';
import { resolveWindowIconPath } from '../utils/app-icon';
import { createLogger } from '@dailyuse/utils';
import { getDesktopDevServerUrlOrDefault, usesDesktopViteDevServer } from '../utils';

// ESM compatibility for __dirname
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

let mainWindow: BrowserWindow | null = null;
const logger = createLogger('AppLifecycle');

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
    icon: resolveWindowIconPath(),
    show: false,
  });

  mainWindow.setMenuBarVisibility(false);
  mainWindow.removeMenu();

  // Show window only when ready to avoid white screen
  mainWindow.once('ready-to-show', () => {
    mainWindow?.show();
  });

  // Load application
  if (usesDesktopViteDevServer()) {
    // Development mode: Load Vite dev server
    mainWindow.loadURL(getDesktopDevServerUrlOrDefault());
    mainWindow.webContents.openDevTools({ mode: 'detach' });
  } else {
    // Production mode: Load bundled HTML
    mainWindow.loadFile(path.join(__dirname, '../dist-renderer/index.html'));
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
 * 1. 检查是否存在已记住账号
 * 2. 始终先显示登录窗口
 * 3. 登录窗口内部根据 remembered account / auto-login 状态决定交互
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
  const rememberedAccounts = getRememberedAccountsService();
  const rememberedAccountList = await rememberedAccounts.list();
  const quickLoginAccounts = rememberedAccountList.map((account) => ({
    id: account.identityId,
    username: account.nickname || account.identifier,
    email: account.identifier,
    avatarUrl: account.avatarUrl ?? undefined,
    lastLoginAt: account.lastLoginAt,
  }));

  let win: BrowserWindow;
  stopScheduleRuntime();
  win = windowManager.createLoginWindow({
    hasQuickLoginAccounts: quickLoginAccounts.length > 0,
    quickLoginAccounts,
  });
  console.log('[Lifecycle] Created login window');

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
  app
    .whenReady()
    .then(() => handleAppReady(initializeApp))
    .catch((error) => {
      logger.error('App ready sequence failed', error);
      app.quit();
    });

  // Handle all windows closed
  app.on('window-all-closed', handleWindowAllClosed);

  // Cleanup before quit
  app.on('before-quit', () => {
    void handleBeforeQuit().catch((error) => {
      logger.error('Before-quit cleanup failed', error);
    });
  });

  // Set security handlers
  setupSecurityHandlers();
}
