/**
 * @file Tray Manager
 * @description
 * Manages the application system tray icon, context menu, and flash notifications.
 *
 * @module modules/tray/trayManager
 */

import { Tray, Menu, app, nativeImage, type BrowserWindow } from 'electron';
import { assetManifest } from '@dailyuse/assets';
import { resolveAssetPath, resolveAssetPathFromKey } from '../../utils/asset-path';

/**
 * @class TrayManager
 * @description Class for managing the system tray integration.
 */
export class TrayManager {
  private tray: Tray | null = null;
  private flashTimer: NodeJS.Timeout | null = null;
  private isFlashing = false;
  private isIconTransparent = false;
  private readonly iconPath: string;
  private readonly transparentIconPath: string; // Or generate programmatically

  /**
   * @constructor
   * @description Creates an instance of TrayManager.
   *
   * @param {BrowserWindow} mainWindow - The main application window.
   */
  constructor(private mainWindow: BrowserWindow) {
    this.iconPath =
      resolveAssetPathFromKey('images', 'logo32', assetManifest) ??
      resolveAssetPath('images/logos/DailyUse-32.png');
    this.transparentIconPath =
      resolveAssetPathFromKey('images', 'logo16', assetManifest) ??
      resolveAssetPath('images/logos/DailyUse-16.png');
    this.init();
  }

  /**
   * @method init
   * @description Initializes the tray icon and context menu.
   */
  private init(): void {
    try {
      const icon = nativeImage.createFromPath(this.iconPath);
      this.tray = new Tray(icon);
      this.tray.setToolTip('DailyUse');
      this.updateContextMenu();

      this.tray.on('click', () => {
        this.toggleWindow();
      });
    } catch (error) {
      console.error('Failed to create tray icon:', error);
    }
  }

  /**
   * @method updateContextMenu
   * @description Updates the tray context menu.
   */
  private updateContextMenu(): void {
    if (!this.tray) return;

    const contextMenu = Menu.buildFromTemplate([
      {
        label: 'Show App',
        click: () => this.mainWindow.show(),
      },
      {
        label: 'Settings',
        click: () => {
          this.mainWindow.show();
          this.mainWindow.webContents.send('navigate', '/settings');
        },
      },
      { type: 'separator' },
      {
        label: 'Quit',
        click: () => {
          app.quit();
        },
      },
    ]);

    this.tray.setContextMenu(contextMenu);
  }

  /**
   * @method toggleWindow
   * @description Toggles the main window visibility.
   */
  private toggleWindow(): void {
    if (this.mainWindow.isVisible()) {
      this.mainWindow.hide();
    } else {
      this.mainWindow.show();
      this.mainWindow.focus();
    }
  }

  /**
   * @method startFlashing
   * @description Starts flashing the tray icon to indicate a notification.
   */
  startFlashing(): void {
    if (this.isFlashing || !this.tray) return;

    this.isFlashing = true;
    this.flashTimer = setInterval(() => {
      if (!this.tray) return;
      this.isIconTransparent = !this.isIconTransparent;
      // Note: This requires two icon files or programmatic image manipulation
      // For now, we simulate by doing nothing or verify path existence
      // const icon = this.isIconTransparent ? this.transparentIconPath : this.iconPath;
      // this.tray.setImage(icon);
    }, 500);
  }

  /**
   * @method stopFlashing
   * @description Stops flashing the tray icon.
   */
  stopFlashing(): void {
    if (!this.isFlashing) return;

    this.isFlashing = false;
    if (this.flashTimer) {
      clearInterval(this.flashTimer);
      this.flashTimer = null;
    }

    if (this.tray) {
      this.tray.setImage(this.iconPath);
    }
  }
}
