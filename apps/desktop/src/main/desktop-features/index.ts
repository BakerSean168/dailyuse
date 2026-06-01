/**
 * Desktop Features Management
 *
 * 统一管理桌面原生特性：
 * - 系统托盘（TrayManager）
 * - 全局快捷键（ShortcutManager）
 * - 开机自启（AutoLaunchManager）
 */

import type { BrowserWindow } from 'electron';
import { TrayManager } from '../modules/tray';
import { ShortcutManager } from '../modules/shortcuts';
import { AutoLaunchManager } from '../modules/autolaunch';

export class DesktopFeaturesRuntime {
  constructor(
    readonly trayManager: TrayManager,
    readonly shortcutManager: ShortcutManager,
    readonly autoLaunchManager: AutoLaunchManager,
  ) {}

  bindWindow(mainWindow: BrowserWindow): void {
    this.trayManager.setMainWindow(mainWindow);
    this.shortcutManager.setMainWindow(mainWindow);
  }

  async destroy(): Promise<void> {
    this.shortcutManager.unregisterAll();
    this.trayManager.destroy();
  }
}

/**
 * 初始化所有桌面特性
 *
 * @param mainWindow 主窗口引用（TrayManager 和 ShortcutManager 需要）
 */
export async function initializeDesktopFeatures(
  mainWindow: BrowserWindow,
): Promise<DesktopFeaturesRuntime> {
  console.log('[Desktop Features] Initializing...');

  const trayManager = new TrayManager(mainWindow);
  console.log('[Desktop Features] Tray manager initialized');

  const shortcutManager = new ShortcutManager(mainWindow);
  console.log('[Desktop Features] Shortcut manager initialized');

  const autoLaunchManager = new AutoLaunchManager({
    name: 'Memoflow',
    isHidden: true,
  });
  await autoLaunchManager.init();
  console.log('[Desktop Features] Auto-launch manager initialized');

  return new DesktopFeaturesRuntime(trayManager, shortcutManager, autoLaunchManager);
}
