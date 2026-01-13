/**
 * Sync IPC Handlers - Desktop Main Process
 * 同步模块 IPC 处理器
 *
 * 提供同步功能的 IPC 接口：
 * - GitHub Gist 同步
 * - 数据导入/导出
 * - 同步协调器
 */

import { ipcMain, BrowserWindow, type IpcMainInvokeEvent } from 'electron';
import { createLogger, type ILogger } from '@dailyuse/utils';
import type {
  SyncPayload,
  SyncResult,
  SyncStatus,
  ImportExportOptions,
  ImportResult,
  ExportResult,
} from '@dailyuse/contracts/sync';
import {
  getSyncManager,
  createGitHubGistSyncProvider,
  type GitHubGistProviderOptions,
  type GitHubOAuthState,
  type GitHubUserInfo,
  getDataCollector,
  getSyncCoordinator,
  getDataExportImportService,
  getDataMigrationService,
} from '../infrastructure';

// Logger
const logger = createLogger('SyncIpcHandlers');

// 同步提供者配置（从环境变量或配置文件读取）
let gitHubGistOptions: GitHubGistProviderOptions | null = null;

/**
 * 配置 GitHub Gist 同步提供者
 */
export function configureGitHubGistProvider(options: GitHubGistProviderOptions): void {
  gitHubGistOptions = options;
  logger.info('GitHub Gist provider configured');
}

/**
 * 获取或创建 GitHub Gist 同步提供者
 */
function getGitHubGistProvider() {
  const syncManager = getSyncManager();
  let provider = syncManager.getProvider('github-gist');

  if (!provider && gitHubGistOptions) {
    provider = createGitHubGistSyncProvider(gitHubGistOptions, logger);
    syncManager.registerProvider(provider);
  }

  return provider;
}

// ============ GitHub Gist Sync Handlers ============

/**
 * 连接到 GitHub (OAuth 认证)
 */
async function handleGitHubConnect(): Promise<{ success: boolean; error?: string }> {
  try {
    const provider = getGitHubGistProvider();
    if (!provider) {
      return { success: false, error: 'GitHub Gist provider not configured' };
    }

    const connected = await provider.connect();

    if (connected) {
      // 设置为活跃提供者
      const syncManager = getSyncManager();
      await syncManager.setActiveProvider('github-gist');
    }

    return { success: connected };
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    logger.error('GitHub connect failed', { error: message });
    return { success: false, error: message };
  }
}

/**
 * 断开 GitHub 连接
 */
async function handleGitHubDisconnect(): Promise<{ success: boolean }> {
  try {
    const provider = getGitHubGistProvider();
    if (provider) {
      await provider.disconnect();
    }
    return { success: true };
  } catch (error) {
    logger.error('GitHub disconnect failed', { error });
    return { success: false };
  }
}

/**
 * 获取 GitHub 连接状态
 */
async function handleGetGitHubStatus(): Promise<{
  connected: boolean;
  user?: GitHubUserInfo;
  gistId?: string;
  lastSyncTime?: number;
  syncStatus: SyncStatus;
}> {
  const syncManager = getSyncManager();
  const provider = getGitHubGistProvider();

  if (!provider || !provider.isConnected()) {
    return {
      connected: false,
      syncStatus: 'idle',
    };
  }

  const authState = (provider as any).getAuthState?.() as GitHubOAuthState | undefined;
  const gistId = (provider as any).getGistId?.() as string | undefined;

  return {
    connected: true,
    user: authState?.user,
    gistId: gistId || undefined,
    lastSyncTime: syncManager.getLastSyncTime() || undefined,
    syncStatus: syncManager.getStatus(),
  };
}

/**
 * 获取 GitHub 用户信息
 */
async function handleGetGitHubUser(): Promise<GitHubUserInfo | null> {
  const provider = getGitHubGistProvider();
  if (!provider || !provider.isConnected()) {
    return null;
  }

  const authState = (provider as any).getAuthState?.() as GitHubOAuthState | undefined;
  return authState?.user || null;
}

/**
 * 设置 GitHub Access Token (用于恢复已保存的认证)
 */
async function handleSetGitHubToken(
  _event: IpcMainInvokeEvent,
  accessToken: string,
  gistId?: string
): Promise<{ success: boolean; error?: string }> {
  try {
    const provider = getGitHubGistProvider();
    if (!provider) {
      return { success: false, error: 'GitHub Gist provider not configured' };
    }

    const success = await (provider as any).setAccessToken?.(accessToken);

    if (success && gistId) {
      (provider as any).setGistId?.(gistId);
    }

    if (success) {
      const syncManager = getSyncManager();
      await syncManager.setActiveProvider('github-gist');
    }

    return { success: !!success };
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    return { success: false, error: message };
  }
}

/**
 * 推送数据到 GitHub Gist
 */
async function handleGitHubPush(): Promise<SyncResult> {
  const syncManager = getSyncManager();

  if (!syncManager.getActiveProvider()) {
    return {
      success: false,
      operation: 'push',
      syncedCount: 0,
      conflictCount: 0,
      error: 'No active sync provider',
      timestamp: Date.now(),
    };
  }

  return syncManager.push();
}

/**
 * 从 GitHub Gist 拉取数据
 */
async function handleGitHubPull(): Promise<SyncResult> {
  const syncManager = getSyncManager();

  if (!syncManager.getActiveProvider()) {
    return {
      success: false,
      operation: 'pull',
      syncedCount: 0,
      conflictCount: 0,
      error: 'No active sync provider',
      timestamp: Date.now(),
    };
  }

  return syncManager.pull();
}

/**
 * 执行完整同步
 */
async function handleGitHubFullSync(): Promise<SyncResult> {
  const syncManager = getSyncManager();

  if (!syncManager.getActiveProvider()) {
    return {
      success: false,
      operation: 'full-sync',
      syncedCount: 0,
      conflictCount: 0,
      error: 'No active sync provider',
      timestamp: Date.now(),
    };
  }

  return syncManager.fullSync();
}

// ============ Data Import/Export Handlers ============

/**
 * 导出数据（带文件选择对话框）
 */
async function handleExportData(
  event: IpcMainInvokeEvent,
  options?: Partial<ImportExportOptions>
): Promise<ExportResult> {
  try {
    const exportService = getDataExportImportService();
    const parentWindow = BrowserWindow.fromWebContents(event.sender);

    const result = await exportService.exportWithDialog(parentWindow, {
      format: 'json',
      includeGoals: options?.includeGoals,
      includeTasks: options?.includeTasks,
      includeSchedules: options?.includeSchedules,
      includeReminders: options?.includeReminders,
      includeSettings: options?.includeSettings,
      pretty: true,
    });

    return {
      success: result.success,
      exported: {
        goals: result.exportedCounts?.goals || 0,
        tasks: result.exportedCounts?.tasks || 0,
        schedules: result.exportedCounts?.schedules || 0,
        reminders: result.exportedCounts?.reminders || 0,
        settings: false,
      },
      error: result.error,
    };
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    return {
      success: false,
      exported: {
        goals: 0,
        tasks: 0,
        schedules: 0,
        reminders: 0,
        settings: false,
      },
      error: message,
    };
  }
}

/**
 * 导入数据（带文件选择对话框）
 */
async function handleImportData(
  event: IpcMainInvokeEvent,
  filePath?: string,
  options?: Partial<ImportExportOptions>
): Promise<ImportResult> {
  try {
    const importService = getDataExportImportService();

    let result;

    if (filePath) {
      // 使用指定的文件路径
      result = await importService.importFromFile(filePath, {
        overwrite: options?.overwrite,
        merge: options?.merge,
        conflictStrategy: options?.conflictStrategy as 'keep-local' | 'keep-import' | 'skip',
      });
    } else {
      // 显示文件选择对话框
      const parentWindow = BrowserWindow.fromWebContents(event.sender);
      result = await importService.importWithDialog(parentWindow, {
        overwrite: options?.overwrite,
        merge: options?.merge,
        conflictStrategy: options?.conflictStrategy as 'keep-local' | 'keep-import' | 'skip',
      });
    }

    return {
      success: result.success,
      imported: {
        goals: result.importedCounts?.goals || 0,
        tasks: result.importedCounts?.tasks || 0,
        schedules: result.importedCounts?.schedules || 0,
        reminders: result.importedCounts?.reminders || 0,
        settings: false,
      },
      skipped: 
        (result.skippedCounts?.goals || 0) +
        (result.skippedCounts?.tasks || 0) +
        (result.skippedCounts?.schedules || 0) +
        (result.skippedCounts?.reminders || 0),
      overwritten: 0,
      errors: result.errors || (result.error ? [result.error] : []),
      warnings: [],
    };
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    return {
      success: false,
      imported: {
        goals: 0,
        tasks: 0,
        schedules: 0,
        reminders: 0,
        settings: false,
      },
      skipped: 0,
      overwritten: 0,
      errors: [message],
      warnings: [],
    };
  }
}

/**
 * 获取导出预览（数据统计）
 */
async function handleGetExportPreview(): Promise<{
  goals: number;
  tasks: number;
  schedules: number;
  reminders: number;
  settings: boolean;
  totalSize?: number;
}> {
  try {
    const dataCollector = getDataCollector();
    const data = await dataCollector.collectAllData();

    return {
      goals: data.goals?.length || 0,
      tasks: data.tasks?.length || 0,
      schedules: data.schedules?.length || 0,
      reminders: data.reminders?.length || 0,
      settings: !!data.settings,
    };
  } catch (error) {
    logger.error('Failed to get export preview', { error });
    return {
      goals: 0,
      tasks: 0,
      schedules: 0,
      reminders: 0,
      settings: false,
    };
  }
}

// ============ Sync Coordinator Handlers ============

/**
 * 触发同步
 */
async function handleTriggerSync(): Promise<SyncResult | null> {
  const coordinator = getSyncCoordinator();
  return coordinator.triggerSync('manual');
}

/**
 * 强制全量同步
 */
async function handleForceFullSync(): Promise<SyncResult | null> {
  const coordinator = getSyncCoordinator();
  return coordinator.forceFullSync();
}

/**
 * 获取同步协调器状态
 */
async function handleGetSyncCoordinatorStatus(): Promise<{
  syncStatus: SyncStatus;
  isSyncing: boolean;
  hasPendingChanges: boolean;
  networkStatus: string;
  changeStats: {
    total: number;
    unsynced: number;
  };
}> {
  const coordinator = getSyncCoordinator();
  const stats = coordinator.getChangeStats();

  return {
    syncStatus: coordinator.getSyncStatus(),
    isSyncing: coordinator.isSyncing(),
    hasPendingChanges: coordinator.hasPendingChanges(),
    networkStatus: coordinator.getNetworkStatus(),
    changeStats: {
      total: stats.total,
      unsynced: stats.unsynced,
    },
  };
}

// ============ Data Migration Handlers ============

/**
 * 创建数据备份
 */
async function handleCreateBackup(
  _event: IpcMainInvokeEvent,
  identifier: string
): Promise<{ success: boolean; path?: string; error?: string }> {
  try {
    const migrationService = getDataMigrationService();
    const backupPath = await migrationService.createBackup(identifier);
    return { success: true, path: backupPath };
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    return { success: false, error: message };
  }
}

/**
 * 列出所有备份
 */
async function handleListBackups(): Promise<
  Array<{
    name: string;
    path: string;
    createdAt: number;
    identifier: string;
  }>
> {
  const migrationService = getDataMigrationService();
  return migrationService.listBackups();
}

/**
 * 从备份恢复
 */
async function handleRestoreBackup(
  _event: IpcMainInvokeEvent,
  backupPath: string
): Promise<{ success: boolean; error?: string }> {
  try {
    const migrationService = getDataMigrationService();
    const success = await migrationService.restoreFromBackup(backupPath);
    return { success };
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    return { success: false, error: message };
  }
}

/**
 * 删除备份
 */
async function handleDeleteBackup(
  _event: IpcMainInvokeEvent,
  backupPath: string
): Promise<{ success: boolean }> {
  const migrationService = getDataMigrationService();
  const success = await migrationService.deleteBackup(backupPath);
  return { success };
}

// ============ Register Handlers ============

/**
 * 注册所有 Sync IPC 处理器
 */
export function registerSyncIpcHandlers(): void {
  logger.info('Registering Sync IPC handlers');

  // GitHub Gist Sync
  ipcMain.handle('sync:github:connect', handleGitHubConnect);
  ipcMain.handle('sync:github:disconnect', handleGitHubDisconnect);
  ipcMain.handle('sync:github:get-status', handleGetGitHubStatus);
  ipcMain.handle('sync:github:get-user', handleGetGitHubUser);
  ipcMain.handle('sync:github:set-token', handleSetGitHubToken);
  ipcMain.handle('sync:github:push', handleGitHubPush);
  ipcMain.handle('sync:github:pull', handleGitHubPull);
  ipcMain.handle('sync:github:full-sync', handleGitHubFullSync);

  // Data Import/Export
  ipcMain.handle('sync:export-data', handleExportData);
  ipcMain.handle('sync:import-data', handleImportData);
  ipcMain.handle('sync:get-export-preview', handleGetExportPreview);

  // Sync Coordinator
  ipcMain.handle('sync:trigger', handleTriggerSync);
  ipcMain.handle('sync:force-full', handleForceFullSync);
  ipcMain.handle('sync:get-coordinator-status', handleGetSyncCoordinatorStatus);

  // Data Migration / Backup
  ipcMain.handle('sync:backup:create', handleCreateBackup);
  ipcMain.handle('sync:backup:list', handleListBackups);
  ipcMain.handle('sync:backup:restore', handleRestoreBackup);
  ipcMain.handle('sync:backup:delete', handleDeleteBackup);

  logger.info('Sync IPC handlers registered');
}

/**
 * 取消注册所有 Sync IPC 处理器
 */
export function unregisterSyncIpcHandlers(): void {
  // GitHub Gist Sync
  ipcMain.removeHandler('sync:github:connect');
  ipcMain.removeHandler('sync:github:disconnect');
  ipcMain.removeHandler('sync:github:get-status');
  ipcMain.removeHandler('sync:github:get-user');
  ipcMain.removeHandler('sync:github:set-token');
  ipcMain.removeHandler('sync:github:push');
  ipcMain.removeHandler('sync:github:pull');
  ipcMain.removeHandler('sync:github:full-sync');

  // Data Import/Export
  ipcMain.removeHandler('sync:export-data');
  ipcMain.removeHandler('sync:import-data');
  ipcMain.removeHandler('sync:get-export-preview');

  // Sync Coordinator
  ipcMain.removeHandler('sync:trigger');
  ipcMain.removeHandler('sync:force-full');
  ipcMain.removeHandler('sync:get-coordinator-status');

  // Data Migration / Backup
  ipcMain.removeHandler('sync:backup:create');
  ipcMain.removeHandler('sync:backup:list');
  ipcMain.removeHandler('sync:backup:restore');
  ipcMain.removeHandler('sync:backup:delete');

  logger.info('Sync IPC handlers unregistered');
}
