/**
 * Custom Notification Window Manager
 *
 * Manages a transparent, frameless, always-on-top window for custom
 * notification toasts positioned at the bottom right of the screen.
 *
 * @module services/custom-notification.manager
 */

import { BrowserWindow, screen, ipcMain } from 'electron';
import path from 'path';
import { fileURLToPath } from 'url';
import { createLogger } from '@dailyuse/utils';
import { NotificationChannels } from '../../shared/types/ipc-channels';
import type { NotificationOptions } from './notification.service';
import { getWindowManager } from '../lifecycle/WindowManager';
import { resolvePreloadPath } from '../utils/resolve-preload-path';
import { getDesktopDevServerUrlOrDefault, usesDesktopViteDevServer } from '../utils';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const logger = createLogger('CustomNotificationManager');

export class CustomNotificationManager {
  private static instance: CustomNotificationManager | null = null;
  private notificationWindow: BrowserWindow | null = null;
  private isDev = usesDesktopViteDevServer();
  private devServerUrl = getDesktopDevServerUrlOrDefault();
  private preloadPath = resolvePreloadPath(__dirname);

  private notificationQueue: Array<NotificationOptions & { id: string }> = [];
  private isRendererReady: boolean = false;

  private constructor() {
    this.registerIpcHandlers();
  }

  static getInstance(): CustomNotificationManager {
    if (!CustomNotificationManager.instance) {
      CustomNotificationManager.instance = new CustomNotificationManager();
    }
    return CustomNotificationManager.instance;
  }

  private createWindow(): BrowserWindow {
    if (this.notificationWindow && !this.notificationWindow.isDestroyed()) {
      logger.info('[Desktop][CustomNotification] Reusing existing notification window', {
        isVisible: this.notificationWindow.isVisible(),
        isRendererReady: this.isRendererReady,
        queueLength: this.notificationQueue.length,
      });
      return this.notificationWindow;
    }

    const primaryDisplay = screen.getPrimaryDisplay();
    const { x: workAreaX, y: workAreaY, width: workAreaWidth, height: workAreaHeight } = primaryDisplay.workArea;

    // Fixed width for notifications, height is initially small but can grow
    const windowWidth = 360;
    const windowHeight = 10; // Start small, resize later based on content

    const win = new BrowserWindow({
      width: windowWidth,
      height: windowHeight,
      x: workAreaX + workAreaWidth - windowWidth - 20, // 20px margin from right
      y: workAreaY + workAreaHeight - windowHeight - 20, // 20px margin from bottom
      frame: false,
      transparent: true,
      alwaysOnTop: true,
      skipTaskbar: true,
      focusable: false,
      resizable: false,
      hasShadow: false, // Let CSS handle shadows
      backgroundColor: '#00000000',
      webPreferences: {
        preload: this.preloadPath,
        contextIsolation: true,
        nodeIntegration: false,
        sandbox: false,
        backgroundThrottling: false, // Keep animations smooth even when not focused
      },
      show: false, // Don't show immediately
    });

    this.isRendererReady = false;
    win.setBackgroundColor('#00000000');
    logger.info('[Desktop][CustomNotification] Creating notification window', {
      isDev: this.isDev,
      devServerUrl: this.devServerUrl,
      preloadPath: this.preloadPath,
      bounds: {
        x: workAreaX + workAreaWidth - windowWidth - 20,
        y: workAreaY + workAreaHeight - windowHeight - 20,
        width: windowWidth,
        height: windowHeight,
      },
    });

    // Make window non-clickable where transparent
    win.setIgnoreMouseEvents(true, { forward: true });

    if (this.isDev) {
      win.loadURL(`${this.devServerUrl}#/custom-notification`);
    } else {
      win.loadFile(path.join(__dirname, '../dist-renderer/index.html'), {
        hash: '/custom-notification',
      });
    }

    win.webContents.on('did-finish-load', () => {
      logger.info('[Desktop][CustomNotification] Window did-finish-load', {
        url: win.webContents.getURL(),
      });
    });

    win.webContents.on('dom-ready', () => {
      logger.info('[Desktop][CustomNotification] Window dom-ready', {
        url: win.webContents.getURL(),
      });
    });

    win.webContents.on(
      'did-fail-load',
      (_event, errorCode, errorDescription, validatedURL, isMainFrame) => {
        logger.error('[Desktop][CustomNotification] Window did-fail-load', {
          errorCode,
          errorDescription,
          validatedURL,
          isMainFrame,
        });
      },
    );

    win.webContents.on('console-message', (_event, level, message, line, sourceId) => {
      logger.info('[Desktop][CustomNotification][Renderer]', {
        level,
        message,
        line,
        sourceId,
      });
    });

    this.notificationWindow = win;

    win.on('closed', () => {
      logger.info('[Desktop][CustomNotification] Notification window closed');
      this.isRendererReady = false;
      this.notificationWindow = null;
    });

    return win;
  }

  private flushQueuedNotifications(reason: string): void {
    if (!this.notificationWindow || this.notificationWindow.isDestroyed()) {
      logger.warn('[Desktop][CustomNotification] Flush skipped because window is unavailable', {
        reason,
        queueLength: this.notificationQueue.length,
      });
      return;
    }

    if (!this.isRendererReady) {
      logger.info('[Desktop][CustomNotification] Flush deferred until renderer is ready', {
        reason,
        queueLength: this.notificationQueue.length,
      });
      return;
    }

    if (this.notificationQueue.length === 0) {
      logger.info('[Desktop][CustomNotification] Flush skipped because queue is empty', {
        reason,
      });
      return;
    }

    logger.info('[Desktop][CustomNotification] Flushing queued notifications', {
      reason,
      queueLength: this.notificationQueue.length,
    });

    for (const notification of this.notificationQueue) {
      this.notificationWindow.webContents.send(NotificationChannels.CUSTOM_RECEIVE, notification);
    }

    this.notificationQueue = [];
  }

  /**
   * Dispatches a notification to the custom window.
   *
   * @param {NotificationOptions} options - The notification options.
   */
  dispatch(options: NotificationOptions): void {
    const id = Math.random().toString(36).substring(2, 9);
    const notificationWithId = { ...options, id };

    const win = this.createWindow();
    logger.info('[Desktop][CustomNotification] Dispatch requested', {
      id,
      title: options.title,
      isWindowLoading: win.webContents.isLoading(),
      isRendererReady: this.isRendererReady,
      queueLength: this.notificationQueue.length,
    });

    // If renderer is ready, send immediately
    if (this.isRendererReady && win.webContents && !win.webContents.isLoading()) {
      logger.info('[Desktop][CustomNotification] Sending notification to renderer immediately', {
        id,
        title: options.title,
      });
      win.webContents.send(NotificationChannels.CUSTOM_RECEIVE, notificationWithId);
    } else {
      this.notificationQueue.push(notificationWithId);
      logger.info('[Desktop][CustomNotification] Queued notification until renderer is ready', {
        id,
        title: options.title,
        queueLength: this.notificationQueue.length,
      });
      this.flushQueuedNotifications('dispatch');
    }
  }

  /**
   * Registers IPC handlers for custom notifications.
   */
  private registerIpcHandlers(): void {
    // Handle notification click
    ipcMain.handle(
      NotificationChannels.CUSTOM_CLICK,
      (_, id: string, data?: Record<string, unknown>) => {
        console.log(`[CustomNotification] Clicked notification ${id}`, data);

        const windowManager = getWindowManager();
        const mainWin = windowManager.getMainWindow();

        if (mainWin) {
          if (mainWin.isMinimized()) {
            mainWin.restore();
          }
          mainWin.focus();

          if (data) {
            mainWin.webContents.send('notification:clicked', data);
          }
        }
      },
    );

    // Handle notification close (manual dismiss)
    ipcMain.handle(NotificationChannels.CUSTOM_CLOSE, (_, id: string) => {
      logger.info('[Desktop][CustomNotification] Notification closed from renderer', { id });
    });

    // Handle window resizing dynamically based on notification count/height
    ipcMain.handle(NotificationChannels.CUSTOM_RESIZE, (_, height: number) => {
      if (this.notificationWindow && !this.notificationWindow.isDestroyed()) {
        if (height <= 0) {
          logger.info('[Desktop][CustomNotification] Hiding notification window after resize', {
            height,
          });
          this.notificationWindow.hide();
          this.notificationWindow.setIgnoreMouseEvents(true, { forward: true });
        } else {
          const primaryDisplay = screen.getPrimaryDisplay();
          const { x: workAreaX, y: workAreaY, width: workAreaWidth, height: workAreaHeight } = primaryDisplay.workArea;
          const windowWidth = 360;

          // Reposition to stay anchored to the bottom right
          this.notificationWindow.setBounds({
            x: workAreaX + workAreaWidth - windowWidth - 20,
            y: workAreaY + workAreaHeight - height - 20,
            width: windowWidth,
            height: height,
          });
          logger.info('[Desktop][CustomNotification] Updated notification window bounds', {
            height,
            visible: this.notificationWindow.isVisible(),
          });

          if (!this.notificationWindow.isVisible()) {
            logger.info('[Desktop][CustomNotification] Showing notification window after resize', {
              height,
            });
            this.notificationWindow.showInactive();
          }

          // Note: we don't automatically make it clickable here anymore.
          // We let the mouse-enter/leave events handle it to prevent dead-zones.
        }
      }
    });

    // Handle precise mouse interaction to avoid dead-zones in transparent areas
    ipcMain.handle(NotificationChannels.CUSTOM_MOUSE_ENTER, () => {
      if (this.notificationWindow && !this.notificationWindow.isDestroyed()) {
        logger.info('[Desktop][CustomNotification] Mouse entered notification card');
        // When mouse is explicitly over a card, stop ignoring mouse events so click works
        this.notificationWindow.setIgnoreMouseEvents(false);
      }
    });

    ipcMain.handle(NotificationChannels.CUSTOM_MOUSE_LEAVE, () => {
      if (this.notificationWindow && !this.notificationWindow.isDestroyed()) {
        logger.info('[Desktop][CustomNotification] Mouse left notification card');
        // When mouse leaves a card, start ignoring again to let clicks pass through to apps below
        this.notificationWindow.setIgnoreMouseEvents(true, { forward: true });
      }
    });

    ipcMain.handle(NotificationChannels.CUSTOM_RENDERER_READY, () => {
      this.isRendererReady = true;
      logger.info('[Desktop][CustomNotification] Renderer reported ready', {
        queueLength: this.notificationQueue.length,
      });
      this.flushQueuedNotifications('renderer-ready');
      return true;
    });
  }
}

export function getCustomNotificationManager(): CustomNotificationManager {
  return CustomNotificationManager.getInstance();
}
