/**
 * @file System IPC Handlers
 * @description
 * Centralized registration for system-level IPC channels, including:
 * - system:* - System utilities (version, memory usage, performance stats).
 * - desktop:* - Desktop features (auto-launch, shortcuts, tray).
 *
 * @module ipc/system-handlers
 */

import { app, ipcMain } from 'electron';
import type { TrayManager } from '../modules/tray';
import type { ShortcutManager } from '../modules/shortcuts';
import type { AutoLaunchManager } from '../modules/autolaunch';
import { getLazyModuleStats } from '../di';
import { getIpcCache } from '../utils';

/**
 * @function registerSystemHandlers
 * @description Registers system-level utility IPC handlers.
 * Channels: 'system:getAppVersion', 'system:getLazyModuleStats',
 * 'system:getMemoryUsage', 'system:getIpcCacheStats'
 */
function registerSystemHandlers(): void {
  /**
   * @description 获取应用版本
   * Channel Name: system:getAppVersion
   * Payload: void
   * Return: string
   * Security: None
   */
  ipcMain.handle('system:getAppVersion', async () => {
    return app.getVersion();
  });

  /**
   * @description 获取懒加载模块统计
   * Channel Name: system:getLazyModuleStats
   * Payload: void
   * Return: ModuleStats
   * Security: Requires authentication
   */
  ipcMain.handle('system:getLazyModuleStats', async () => {
    return getLazyModuleStats();
  });

  /**
   * @description 获取内存使用情况
   * Channel Name: system:getMemoryUsage
   * Payload: void
   * Return: MemoryUsage
   * Security: Requires authentication
   */
  ipcMain.handle('system:getMemoryUsage', async () => {
    const usage = process.memoryUsage();
    return {
      heapUsed: Math.round(usage.heapUsed / 1024 / 1024),
      heapTotal: Math.round(usage.heapTotal / 1024 / 1024),
      external: Math.round(usage.external / 1024 / 1024),
      rss: Math.round(usage.rss / 1024 / 1024),
    };
  });

  /**
   * @description 获取 IPC 缓存统计
   * Channel Name: system:getIpcCacheStats
   * Payload: void
   * Return: CacheStats
   * Security: Requires authentication
   */
  ipcMain.handle('system:getIpcCacheStats', async () => {
    return getIpcCache().getStats();
  });
}

/**
 * @function registerDesktopFeaturesHandlers
 * @description Registers desktop feature IPC handlers (Tray, Shortcuts, AutoLaunch).
 * Channels start with 'desktop:'.
 *
 * @param {TrayManager | null} trayManager - The tray manager instance.
 * @param {ShortcutManager | null} shortcutManager - The shortcut manager instance.
 * @param {AutoLaunchManager | null} autoLaunchManager - The auto-launch manager instance.
 */
function registerDesktopFeaturesHandlers(
  trayManager: TrayManager | null,
  shortcutManager: ShortcutManager | null,
  autoLaunchManager: AutoLaunchManager | null,
): void {
  // ========== Auto Launch ==========
  /**
   * @description 检查自动启动状态
   * Channel Name: desktop:autoLaunch:isEnabled
   * Payload: void
   * Return: boolean
   * Security: None
   */
  ipcMain.handle('desktop:autoLaunch:isEnabled', async () => {
    return autoLaunchManager?.isEnabled() ?? false;
  });

  /**
   * @description 启用自动启动
   * Channel Name: desktop:autoLaunch:enable
   * Payload: void
   * Return: boolean
   * Security: None
   */
  ipcMain.handle('desktop:autoLaunch:enable', async () => {
    return autoLaunchManager?.enable() ?? false;
  });

  /**
   * @description 禁用自动启动
   * Channel Name: desktop:autoLaunch:disable
   * Payload: void
   * Return: boolean
   * Security: None
   */
  ipcMain.handle('desktop:autoLaunch:disable', async () => {
    return autoLaunchManager?.disable() ?? false;
  });

  // Shortcuts
  /**
   * @description 获取所有快捷键
   * Channel Name: desktop:shortcuts:getAll
   * Payload: void
   * Return: ShortcutConfig[]
   * Security: None
   */
  ipcMain.handle('desktop:shortcuts:getAll', async () => {
    return shortcutManager?.getShortcuts() ?? [];
  });

  /**
   * @description 更新快捷键配置
   * Channel Name: desktop:shortcuts:update
   * Payload: accelerator (string), newConfig (object)
   * Return: boolean
   * Security: None
   */
  ipcMain.handle(
    'desktop:shortcuts:update',
    async (_, accelerator: string, newConfig: { enabled?: boolean }) => {
      if (!shortcutManager) return false;
      if (newConfig.enabled === false) {
        shortcutManager.unregister(accelerator);
      } else {
        const shortcuts = shortcutManager.getShortcuts();
        const existing = shortcuts.find((s: any) => s.accelerator === accelerator);
        if (existing) {
          shortcutManager.register({ ...existing, enabled: true });
        }
      }
      return true;
    },
  );

  // Tray
  /**
   * @description 开始托盘图标闪烁
   * Channel Name: desktop:tray:flash
   * Payload: void
   * Return: void
   * Security: None
   */
  ipcMain.handle('desktop:tray:flash', async () => {
    trayManager?.startFlashing();
  });

  /**
   * @description 停止托盘图标闪烁
   * Channel Name: desktop:tray:stopFlash
   * Payload: void
   * Return: void
   * Security: None
   */
  ipcMain.handle('desktop:tray:stopFlash', async () => {
    trayManager?.stopFlashing();
  });
}

// Flag to prevent duplicate handler registration
let systemHandlersRegistered = false;

/**
 * @function registerSystemIpcHandlers
 * @description Registers all system-level IPC handlers.
 *
 * This function is idempotent - calling it multiple times is safe.
 * Handlers are only registered once on the first call.
 *
 * @param {TrayManager | null} trayManager - The tray manager instance.
 * @param {ShortcutManager | null} shortcutManager - The shortcut manager instance.
 * @param {AutoLaunchManager | null} autoLaunchManager - The auto-launch manager instance.
 */
export function registerSystemIpcHandlers(
  trayManager: TrayManager | null,
  shortcutManager: ShortcutManager | null,
  autoLaunchManager: AutoLaunchManager | null,
): void {
  // Prevent duplicate registration
  if (systemHandlersRegistered) {
    console.log('[SystemHandlers] Already registered, skipping...');
    return;
  }
  systemHandlersRegistered = true;

  // ========== System Channels ==========
  registerSystemHandlers();

  // ========== Desktop Features Channels ==========
  registerDesktopFeaturesHandlers(trayManager, shortcutManager, autoLaunchManager);
}
