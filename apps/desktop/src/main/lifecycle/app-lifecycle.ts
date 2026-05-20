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
import { initializeDesktopFeatures, cleanupDesktopFeatures } from '../desktop-features';
import { registerSystemIpcHandlers } from '../ipc/system-handlers';
import { initNotificationService } from '../services';
import { getDesktopProfileRuntimeManager } from '../profile';
import { getWindowManager } from './WindowManager';
import { getRememberedAccountsService } from '../modules/authentication/infrastructure';
import { stopScheduleRuntime } from '@dailyuse/schedule/electron-entry';
import { createLogger } from '@dailyuse/utils';
const logger = createLogger('AppLifecycle');

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

  // Defensive: stop any stale schedule runtime from a previous crash recovery
  stopScheduleRuntime();
  const win = windowManager.createLoginWindow({
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
 * Uses preventDefault to ensure cleanup completes before the app exits.
 */
let isQuitting = false;

async function handleBeforeQuit(event: Electron.Event): Promise<void> {
  if (isQuitting) return; // Already handling quit — let it proceed
  isQuitting = true;
  event.preventDefault();

  console.log('[Lifecycle] Cleaning up before quit...');

  const cleanup = (async () => {
    try {
      // Deactivate the active profile runtime (shuts down PowerSync, destroys bootstrapper)
      const runtimeManager = getDesktopProfileRuntimeManager();
      await runtimeManager.deactivateProfile().catch((err) =>
        console.error('[Lifecycle] Profile deactivation failed during quit:', err),
      );

      // Cleanup desktop feature resources
      await cleanupDesktopFeatures();
    } catch (err) {
      console.error('[Lifecycle] Cleanup failed:', err);
    }
  })();

  // Safety timeout: if cleanup hangs, force quit after 10 seconds
  const timeout = new Promise<void>((resolve) => {
    setTimeout(() => {
      console.warn('[Lifecycle] Cleanup timed out after 10s, forcing quit');
      resolve();
    }, 10_000);
  });

  await Promise.race([cleanup, timeout]);

  console.log('[Lifecycle] Cleanup complete, quitting...');
  app.quit();
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
  app.on('before-quit', (event) => {
    void handleBeforeQuit(event).catch((error) => {
      logger.error('Before-quit cleanup failed', error);
      app.quit();
    });
  });

  // Set security handlers
  setupSecurityHandlers();
}
