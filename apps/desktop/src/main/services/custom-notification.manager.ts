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
import type { NotificationOptions } from './notification.service';
import { getWindowManager } from '../lifecycle/WindowManager';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

export class CustomNotificationManager {
  private static instance: CustomNotificationManager | null = null;
  private notificationWindow: BrowserWindow | null = null;
  private isDev = process.env.NODE_ENV === 'development';
  private devServerUrl = process.env.VITE_DEV_SERVER_URL || 'http://localhost:5173';
  private preloadPath = path.join(__dirname, '../preload.cjs');

  private notificationQueue: Array<NotificationOptions & { id: string }> = [];
  private isWaitingForReady: boolean = false;

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
      webPreferences: {
        preload: this.preloadPath,
        contextIsolation: true,
        nodeIntegration: false,
        sandbox: false,
        backgroundThrottling: false, // Keep animations smooth even when not focused
      },
      show: false, // Don't show immediately
    });

    // Make window non-clickable where transparent
    win.setIgnoreMouseEvents(true, { forward: true });

    if (this.isDev) {
      win.loadURL(`${this.devServerUrl}#/custom-notification`);
    } else {
      win.loadFile(path.join(__dirname, '../../renderer/index.html'), { hash: '/custom-notification' });
    }

    this.notificationWindow = win;

    win.on('closed', () => {
      this.notificationWindow = null;
    });

    return win;
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

    // If window is ready, send immediately
    if (win.webContents && !win.webContents.isLoading()) {
      win.webContents.send('notification:custom:receive', notificationWithId);
      if (!win.isVisible()) {
        win.showInactive();
      }
    } else {
      // Queue it up if still loading
      this.notificationQueue.push(notificationWithId);
      if (!this.isWaitingForReady) {
        this.isWaitingForReady = true;
        win.once('ready-to-show', () => {
          this.isWaitingForReady = false;
          this.notificationQueue.forEach((notif) => {
            win.webContents.send('notification:custom:receive', notif);
          });
          this.notificationQueue = [];
          win.showInactive();
        });
      }
    }
  }

  /**
   * Registers IPC handlers for custom notifications.
   */
  private registerIpcHandlers(): void {
    // Handle notification click
    ipcMain.handle('notification:custom:click', (_, id: string, data?: Record<string, unknown>) => {
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
    });

    // Handle notification close (manual dismiss)
    ipcMain.handle('notification:custom:close', (_, id: string) => {
      console.log(`[CustomNotification] Closed notification ${id}`);
    });

    // Handle window resizing dynamically based on notification count/height
    ipcMain.handle('notification:custom:resize', (_, height: number) => {
      if (this.notificationWindow && !this.notificationWindow.isDestroyed()) {
        if (height <= 0) {
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

          if (!this.notificationWindow.isVisible()) {
            this.notificationWindow.showInactive();
          }

          // Note: we don't automatically make it clickable here anymore.
          // We let the mouse-enter/leave events handle it to prevent dead-zones.
        }
      }
    });

    // Handle precise mouse interaction to avoid dead-zones in transparent areas
    ipcMain.handle('notification:custom:mouse-enter', () => {
      if (this.notificationWindow && !this.notificationWindow.isDestroyed()) {
        // When mouse is explicitly over a card, stop ignoring mouse events so click works
        this.notificationWindow.setIgnoreMouseEvents(false);
      }
    });

    ipcMain.handle('notification:custom:mouse-leave', () => {
      if (this.notificationWindow && !this.notificationWindow.isDestroyed()) {
        // When mouse leaves a card, start ignoring again to let clicks pass through to apps below
        this.notificationWindow.setIgnoreMouseEvents(true, { forward: true });
      }
    });
  }
}

export function getCustomNotificationManager(): CustomNotificationManager {
  return CustomNotificationManager.getInstance();
}
