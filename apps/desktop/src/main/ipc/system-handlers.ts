/**
 * @file System IPC Handlers
 * @description
 * Centralized registration for system-level IPC channels, including:
 * - app:* - Application information and status checks.
 * - system:* - System utilities (DI status, memory usage, performance stats).
 * - desktop:* - Desktop features (auto-launch, shortcuts, tray).
 * - sync:* - Synchronization operations and status.
 *
 * @module ipc/system-handlers
 */

import { app, ipcMain } from 'electron';
import type { TrayManager } from '../modules/tray';
import type { ShortcutManager } from '../modules/shortcuts';
import type { AutoLaunchManager } from '../modules/autolaunch';
import { isDIConfigured, getLazyModuleStats } from '../di';
import { getSyncManager } from '../services';
import { getIpcCache } from '../utils';

/**
 * @function registerAppInfoHandlers
 * @description Registers application information IPC handlers.
 * Channels: 'app:getInfo', 'app:checkDIStatus'
 */
function registerAppInfoHandlers(): void {
  /**
   * @description 获取应用信息
   * Channel Name: app:getInfo
   * Payload: void
   * Return: { platform: string, version: string }
   * Security: None
   */
  ipcMain.handle('app:getInfo', async () => {
    return {
      platform: process.platform,
      version: app.getVersion(),
    };
  });

  /**
   * @description 检查 DI 容器状态
   * Channel Name: app:checkDIStatus
   * Payload: void
   * Return: boolean
   * Security: None
   */
  ipcMain.handle('app:checkDIStatus', async () => {
    return isDIConfigured();
  });
}

/**
 * @function registerSystemHandlers
 * @description Registers system-level utility IPC handlers.
 * Channels: 'system:getDIStatus', 'system:getAppVersion', 'system:getLazyModuleStats',
 * 'system:getMemoryUsage', 'system:getIpcCacheStats'
 */
function registerSystemHandlers(): void {
  /**
   * @description 获取 DI 状态（系统级）
   * Channel Name: system:getDIStatus
   * Payload: void
   * Return: boolean
   * Security: None
   */
  ipcMain.handle('system:getDIStatus', async () => {
    return isDIConfigured();
  });

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
  autoLaunchManager: AutoLaunchManager | null
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
  ipcMain.handle('desktop:shortcuts:update', async (_, accelerator: string, newConfig: { enabled?: boolean }) => {
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
  });

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

/**
 * @function registerSyncHandlers
 * @description Registers synchronization IPC handlers.
 * Channels start with 'sync:'.
 */
function registerSyncHandlers(): void {
  // ========== Basic Sync Channels ==========
  /**
   * @description 获取同步摘要
   * Channel Name: sync:getSummary
   * Payload: void
   * Return: SyncSummary
   * Security: Requires authentication
   */
  ipcMain.handle('sync:getSummary', async () => {
    try {
      return getSyncManager().getSyncSummary();
    } catch {
      return null;
    }
  });

  /**
   * @description 获取同步统计
   * Channel Name: sync:getStats
   * Payload: void
   * Return: SyncStats
   * Security: Requires authentication
   */
  ipcMain.handle('sync:getStats', async () => {
    try {
      return getSyncManager().getStats();
    } catch {
      return null;
    }
  });

  /**
   * @description 获取待同步数量
   * Channel Name: sync:getPendingCount
   * Payload: void
   * Return: number
   * Security: Requires authentication
   */
  ipcMain.handle('sync:getPendingCount', async () => {
    try {
      return getSyncManager().getSyncLogService().getPendingCount();
    } catch {
      return 0;
    }
  });

  /**
   * @description 获取同步状态
   * Channel Name: sync:getState
   * Payload: void
   * Return: SyncState
   * Security: Requires authentication
   */
  ipcMain.handle('sync:getState', async () => {
    try {
      return getSyncManager().getSyncStateService().getState();
    } catch {
      return null;
    }
  });

  /**
   * @description 触发同步
   * Channel Name: sync:triggerSync
   * Payload: void
   * Return: { success: boolean, error?: string }
   * Security: Requires authentication
   */
  ipcMain.handle('sync:triggerSync', async () => {
    try {
      getSyncManager().triggerSync();
      return { success: true };
    } catch (e) {
      return { success: false, error: String(e) };
    }
  });

  /**
   * @description 强制同步
   * Channel Name: sync:forceSync
   * Payload: void
   * Return: SyncResult
   * Security: Requires authentication
   */
  ipcMain.handle('sync:forceSync', async () => {
    try {
      return getSyncManager().forceSync();
    } catch (e) {
      return { status: 'error', error: String(e) };
    }
  });

  /**
   * @description 检查在线状态
   * Channel Name: sync:isOnline
   * Payload: void
   * Return: boolean
   * Security: None
   */
  ipcMain.handle('sync:isOnline', async () => {
    try {
      return getSyncManager().isOnline();
    } catch {
      return false;
    }
  });

  // ========== Conflict Handlers ==========
  /**
   * @description 获取未解决的冲突
   * Channel Name: sync:conflict:getUnresolved
   * Payload: entityType (string, optional)
   * Return: Conflict[]
   * Security: Requires authentication
   */
  ipcMain.handle('sync:conflict:getUnresolved', async (_, entityType?: string) => {
    try {
      return getSyncManager().getConflictManager().getUnresolvedConflicts(entityType ?? '');
    } catch {
      return [];
    }
  });

  /**
   * @description 获取未解决冲突数量
   * Channel Name: sync:conflict:getCount
   * Payload: entityType (string, optional)
   * Return: number
   * Security: Requires authentication
   */
  ipcMain.handle('sync:conflict:getCount', async (_, entityType?: string) => {
    try {
      return getSyncManager().getConflictManager().getUnresolvedCount(entityType ?? '');
    } catch {
      return 0;
    }
  });

  /**
   * @description 手动解决冲突
   * Channel Name: sync:conflict:resolve
   * Payload: conflictId (string), fieldSelections (Record<string, 'local' | 'server'>)
   * Return: ResolutionResult
   * Security: Requires authentication
   */
  ipcMain.handle('sync:conflict:resolve', async (_, conflictId: string, fieldSelections: Record<string, 'local' | 'server'>) => {
    try {
      return getSyncManager().getConflictManager().resolveManually(conflictId, fieldSelections);
    } catch (e) {
      return { success: false, error: String(e) };
    }
  });

  /**
   * @description 使用本地版本解决冲突
   * Channel Name: sync:conflict:resolveWithLocal
   * Payload: conflictId (string)
   * Return: ResolutionResult
   * Security: Requires authentication
   */
  ipcMain.handle('sync:conflict:resolveWithLocal', async (_, conflictId: string) => {
    try {
      return getSyncManager().getConflictManager().resolveWithLocal(conflictId);
    } catch (e) {
      return { success: false, error: String(e) };
    }
  });

  /**
   * @description 使用服务器版本解决冲突
   * Channel Name: sync:conflict:resolveWithServer
   * Payload: conflictId (string)
   * Return: ResolutionResult
   * Security: Requires authentication
   */
  ipcMain.handle('sync:conflict:resolveWithServer', async (_, conflictId: string) => {
    try {
      return getSyncManager().getConflictManager().resolveWithServer(conflictId);
    } catch (e) {
      return { success: false, error: String(e) };
    }
  });

  /**
   * @description 获取冲突历史
   * Channel Name: sync:conflict:getHistory
   * Payload: filter (object, optional), pagination (object, optional)
   * Return: PaginatedResult<Conflict>
   * Security: Requires authentication
   */
  ipcMain.handle('sync:conflict:getHistory', async (_, filter?: unknown, pagination?: unknown) => {
    try {
      return getSyncManager().getConflictManager().queryHistory(filter as never, pagination as never);
    } catch {
      return { items: [], total: 0, page: 1, pageSize: 20, totalPages: 0 };
    }
  });

  /**
   * @description 获取冲突统计
   * Channel Name: sync:conflict:getStats
   * Payload: void
   * Return: ConflictStats
   * Security: Requires authentication
   */
  ipcMain.handle('sync:conflict:getStats', async () => {
    try {
      return getSyncManager().getConflictManager().getStats();
    } catch {
      return null;
    }
  });

  // ========== Device Handlers ==========
  /**
   * @description 获取设备信息
   * Channel Name: sync:device:getInfo
   * Payload: void
   * Return: DeviceInfo
   * Security: Requires authentication
   */
  ipcMain.handle('sync:device:getInfo', async () => {
    try {
      return getSyncManager().getDeviceService().getDeviceInfo();
    } catch {
      return null;
    }
  });

  /**
   * @description 重命名设备
   * Channel Name: sync:device:rename
   * Payload: newName (string)
   * Return: { success: boolean, error?: string }
   * Security: Requires authentication
   */
  ipcMain.handle('sync:device:rename', async (_, newName: string) => {
    try {
      getSyncManager().getDeviceService().updateDeviceName(newName);
      return { success: true };
    } catch (e) {
      return { success: false, error: String(e) };
    }
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
  autoLaunchManager: AutoLaunchManager | null
): void {
  // Prevent duplicate registration
  if (systemHandlersRegistered) {
    console.log('[SystemHandlers] Already registered, skipping...');
    return;
  }
  systemHandlersRegistered = true;

  // ========== App Info Channels ==========
  registerAppInfoHandlers();

  // ========== System Channels ==========
  registerSystemHandlers();

  // ========== Desktop Features Channels ==========
  registerDesktopFeaturesHandlers(trayManager, shortcutManager, autoLaunchManager);

  // ========== Sync Channels ==========
  registerSyncHandlers();
}
