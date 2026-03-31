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

// 管理器实例
let trayManager: TrayManager | null = null;
let shortcutManager: ShortcutManager | null = null;
let autoLaunchManager: AutoLaunchManager | null = null;

/**
 * 初始化所有桌面特性
 * 
 * @param mainWindow 主窗口引用（TrayManager 和 ShortcutManager 需要）
 */
export async function initializeDesktopFeatures(mainWindow: BrowserWindow): Promise<void> {
  console.log('[Desktop Features] Initializing...');

  // 1. 系统托盘 - 构造函数自动初始化
  trayManager = new TrayManager(mainWindow);
  console.log('[Desktop Features] Tray manager initialized');

  // 2. 全局快捷键 - 构造函数自动注册默认快捷键
  shortcutManager = new ShortcutManager(mainWindow);
  console.log('[Desktop Features] Shortcut manager initialized');

  // 3. 开机自启管理器
  autoLaunchManager = new AutoLaunchManager({
    name: 'Memoflow',
    isHidden: true,
  });
  await autoLaunchManager.init();
  console.log('[Desktop Features] Auto-launch manager initialized');
}

export function bindDesktopFeaturesWindow(mainWindow: BrowserWindow): void {
  trayManager?.setMainWindow(mainWindow);
  shortcutManager?.setMainWindow(mainWindow);
}

/**
 * 清理桌面特性资源
 * 在应用关闭前调用以优雅关闭
 */
export async function cleanupDesktopFeatures(): Promise<void> {
  console.log('[Desktop Features] Cleaning up...');

  // 注销所有快捷键
  if (shortcutManager) {
    shortcutManager.unregisterAll();
    console.log('[Desktop Features] Shortcuts unregistered');
  }

  // TrayManager 无需显式销毁，Electron 会自动处理
  if (trayManager) {
    trayManager.destroy();
  }
  console.log('[Desktop Features] Tray cleanup completed');

  trayManager = null;
  shortcutManager = null;
  autoLaunchManager = null;
}

/**
 * 获取管理器实例（用于 IPC 处理器）
 */
export function getDesktopFeaturesManagers() {
  return {
    trayManager,
    shortcutManager,
    autoLaunchManager,
  };
}

/**
 * 导出各管理器的 getter
 */
export function getTrayManager(): TrayManager | null {
  return trayManager;
}

export function getShortcutManager(): ShortcutManager | null {
  return shortcutManager;
}

export function getAutoLaunchManager(): AutoLaunchManager | null {
  return autoLaunchManager;
}
