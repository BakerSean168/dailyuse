/**
 * @file System IPC Handlers
 * @description
 * Centralized registration for system-level IPC channels, including:
 * - system:* - System utilities (version, memory usage, performance stats).
 * - desktop:* - Desktop features (auto-launch, shortcuts, tray).
 *
 * @module ipc/system-handlers
 */

import { app, dialog, ipcMain, shell } from 'electron';
import fs from 'node:fs/promises';
import path from 'node:path';
import type { TrayManager } from '../modules/tray';
import type { ShortcutManager } from '../modules/shortcuts';
import type { AutoLaunchManager } from '../modules/autolaunch';
import { getIpcCache } from '../utils';
import { getSharedPathResolver, updateUserFilesRootPath } from '../runtime-init';
import { resolveDesktopUserFilesPath } from '../user-data-path';

type UserFilesSubdirectory = 'exports' | 'downloads' | 'attachments';

interface SaveTextFileRequest {
  subdirectory?: UserFilesSubdirectory;
  defaultFileName: string;
  content: string;
  filters?: Array<{ name: string; extensions: string[] }>;
}

interface SaveTextFileResult {
  canceled: boolean;
  filePath: string | null;
}

interface OpenTextFileRequest {
  subdirectory?: UserFilesSubdirectory;
  filters?: Array<{ name: string; extensions: string[] }>;
}

interface OpenTextFileResult {
  canceled: boolean;
  filePath: string | null;
  content: string | null;
}

function resolveUserFilesDirectory(subdirectory: UserFilesSubdirectory | undefined): string {
  const sharedResolver = getSharedPathResolver();

  switch (subdirectory) {
    case 'downloads':
      return sharedResolver.userFilesDownloadsDir;
    case 'attachments':
      return sharedResolver.userFilesAttachmentsDir;
    case 'exports':
    default:
      return sharedResolver.userFilesExportsDir;
  }
}

/**
 * @function registerSystemHandlers
 * @description Registers system-level utility IPC handlers.
 * Channels: 'system:getAppVersion', 'system:getMemoryUsage', 'system:getIpcCacheStats'
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

  ipcMain.handle('system:openExternalUrl', async (_event, request: { url?: unknown }) => {
    if (typeof request?.url !== 'string') {
      throw new Error('External URL is required');
    }
    const url = new URL(request.url);
    if (url.protocol !== 'https:' && url.protocol !== 'http:') {
      throw new Error('Only HTTP(S) external URLs are allowed');
    }
    await shell.openExternal(url.toString());
    return { opened: true };
  });

  ipcMain.handle(
    'system:userFiles:saveText',
    async (_event, request: SaveTextFileRequest): Promise<SaveTextFileResult> => {
      const targetDir = resolveUserFilesDirectory(request?.subdirectory);
      await fs.mkdir(targetDir, { recursive: true });

      const result = await dialog.showSaveDialog({
        defaultPath: path.join(targetDir, request.defaultFileName),
        filters: request.filters,
      });

      if (result.canceled || !result.filePath) {
        return { canceled: true, filePath: null };
      }

      await fs.mkdir(path.dirname(result.filePath), { recursive: true });
      await fs.writeFile(result.filePath, request.content, 'utf8');
      return { canceled: false, filePath: result.filePath };
    },
  );

  ipcMain.handle(
    'system:userFiles:openText',
    async (_event, request?: OpenTextFileRequest): Promise<OpenTextFileResult> => {
      const defaultPath = resolveUserFilesDirectory(request?.subdirectory);
      await fs.mkdir(defaultPath, { recursive: true });

      const result = await dialog.showOpenDialog({
        defaultPath,
        properties: ['openFile'],
        filters: request?.filters,
      });

      if (result.canceled || result.filePaths.length === 0) {
        return { canceled: true, filePath: null, content: null };
      }

      const filePath = result.filePaths[0]!;
      const content = await fs.readFile(filePath, 'utf8');
      return { canceled: false, filePath, content };
    },
  );

  // ========== User Files Directory Management ==========

  ipcMain.handle('system:userFiles:getPath', async () => {
    const resolver = getSharedPathResolver();
    const defaultPath = resolveDesktopUserFilesPath();
    return {
      currentPath: resolver.userFilesRootDir,
      defaultPath,
      isCustom: resolver.userFilesRootDir !== defaultPath,
    };
  });

  ipcMain.handle('system:userFiles:pickDirectory', async () => {
    const result = await dialog.showOpenDialog({
      properties: ['openDirectory', 'createDirectory'],
      title: 'Select User Files Directory',
    });

    if (result.canceled || result.filePaths.length === 0) {
      return { canceled: true, path: null };
    }

    const selectedPath = result.filePaths[0]!;
    updateUserFilesRootPath(selectedPath);

    return { canceled: false, path: selectedPath };
  });

  ipcMain.handle('system:userFiles:openDirectory', async () => {
    const resolver = getSharedPathResolver();
    await fs.mkdir(resolver.userFilesRootDir, { recursive: true });
    const error = await shell.openPath(resolver.userFilesRootDir);
    if (error) {
      console.error('[UserFiles] Failed to open directory:', error);
    }
  });

  ipcMain.handle('system:userFiles:resetPath', async () => {
    updateUserFilesRootPath(null);
    const defaultPath = resolveDesktopUserFilesPath();
    return { path: defaultPath };
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
        const existing = shortcuts.find((s) => s.accelerator === accelerator);
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
