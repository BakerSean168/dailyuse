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
import { getTrayManager, getShortcutManager, getAutoLaunchManager } from '../desktop-features';
import { initNotificationService } from '../services';
import { stopMemoryCleanup, closeDatabase } from '../database';
import { getBootstrapper } from '../main';
import { getWindowManager } from './WindowManager';
import { getAccountStore, getTokenManager, registerAccountStoreIpcHandlers } from '../modules/authentication/infrastructure';

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
  const preloadPath = path.join(__dirname, 'preload.cjs');
  
  mainWindow = new BrowserWindow({
    width: 1200,
    height: 800,
    minWidth: 800,
    minHeight: 600,
    webPreferences: {
      preload: preloadPath,
      contextIsolation: true,
      nodeIntegration: false,
      sandbox: false,
    },
    titleBarStyle: 'hiddenInset',
    show: false,
  });

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

  // Register AccountStore IPC handlers
  registerAccountStoreIpcHandlers();
  console.log('[Lifecycle] AccountStore IPC handlers registered');

  // 决定显示哪个窗口
  const windowManager = getWindowManager();
  const accountStore = getAccountStore();
  const tokenManager = getTokenManager();

  // 检查是否有启用自动登录的账号
  const autoLoginAccount = accountStore.getAutoLoginAccount();
  let shouldShowMainWindow = false;

  if (autoLoginAccount) {
    console.log('[Lifecycle] Found auto-login account:', autoLoginAccount.email);
    
    // 检查该账号的 Session 是否有效
    const tokenStatus = await tokenManager.getStatus();
    if (tokenStatus.hasValidToken && !tokenStatus.isAccessTokenExpired) {
      console.log('[Lifecycle] Valid session found, going to main window');
      shouldShowMainWindow = true;
    } else if (tokenStatus.hasValidToken && tokenStatus.shouldRefresh) {
      // 尝试刷新 Token
      console.log('[Lifecycle] Token needs refresh, attempting...');
      try {
        // Token 刷新逻辑由 AuthDesktopApplicationService 处理
        // 这里简单检查是否有 refresh token
        shouldShowMainWindow = true; // 先进入主窗口，后台刷新
      } catch (error) {
        console.log('[Lifecycle] Token refresh failed, showing login window');
      }
    }
  }

  let win: BrowserWindow;

  if (shouldShowMainWindow) {
    // 直接进入主窗口
    win = windowManager.createMainWindow();
    mainWindow = win;
    console.log('[Lifecycle] Created main window (auto-login)');
  } else {
    // 显示登录窗口
    win = windowManager.createLoginWindow({
      hasQuickLoginAccounts: accountStore.getAccountCount() > 0,
      quickLoginAccounts: accountStore.getAccounts().map((a) => ({
        id: a.id,
        username: a.username,
        email: a.email,
        avatarUrl: a.avatarUrl,
        lastLoginAt: a.lastLoginAt,
      })),
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
  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) {
      // 重新检查是否应该显示主窗口或登录窗口
      const wm = getWindowManager();
      const as = getAccountStore();
      const autoLogin = as.getAutoLoginAccount();
      
      if (autoLogin && autoLogin.hasValidSession) {
        wm.createMainWindow();
      } else {
        wm.createLoginWindow();
      }
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
 * Performs cleanup tasks such as stopping timers, cleaning up desktop features,
 * shutting down modules, and closing the database connection.
 *
 * @returns {Promise<void>} A promise that resolves when cleanup is complete.
 */
async function handleBeforeQuit(): Promise<void> {
  console.log('[Lifecycle] Cleaning up before quit...');

  // Stop scheduled tasks
  stopMemoryCleanup();

  // Cleanup desktop feature resources
  await cleanupDesktopFeatures();

  // Shutdown all modules via bootstrapper (graceful shutdown)
  const bootstrapper = getBootstrapper();
  if (bootstrapper) {
    await bootstrapper.destroy();
  }

  // Close database connection
  closeDatabase();

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
