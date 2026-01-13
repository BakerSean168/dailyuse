/**
 * Application Lifecycle Management
 * 
 * Manages the complete lifecycle of the Electron application:
 * - app.whenReady() - Application ready, create window
 * - app.on('activate') - macOS reactivate
 * - app.on('window-all-closed') - All windows closed
 * - app.on('before-quit') - Cleanup before exit
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
import { shutdownAllModules } from '../modules';
import { initializeEventListeners } from '../events/initialize-event-listeners';

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
 * Initializes the application core, event listeners, main window,
 * notification service, desktop features, and system IPC handlers.
 *
 * @param {() => Promise<void>} initializeApp - The application initialization function to be called.
 * @returns {Promise<void>} A promise that resolves when initialization is complete.
 */
async function handleAppReady(initializeApp: () => Promise<void>): Promise<void> {
  // Application core initialization
  await initializeApp();

  // Initialize event listeners
  await initializeEventListeners();
  console.log('[Lifecycle] Event listeners initialized');

  // Register system IPC handlers BEFORE creating window
  // This ensures handlers are ready when renderer starts making IPC calls
  // Desktop feature managers (tray, shortcuts, autolaunch) will be set later
  registerSystemIpcHandlers(null, null, null);
  console.log('[Lifecycle] System IPC handlers registered (initial)');

  // Create main window
  const win = createMainWindow();

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
      createMainWindow();
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

  // Shutdown all modules (graceful shutdown)
  await shutdownAllModules();

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
