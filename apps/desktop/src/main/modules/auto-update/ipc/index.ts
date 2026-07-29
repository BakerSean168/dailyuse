/**
 * Auto Update IPC Handlers
 *
 * Story 13.51: 自动更新集成
 *
 * IPC handlers for auto-update operations
 *
 * @module modules/auto-update/ipc
 */

import { ipcMain, BrowserWindow } from 'electron';
import { AutoUpdateChannels } from '@memoflow/contracts/electron';
import { fail, ok } from '@memoflow/contracts/result';
import { createLogger } from '@memoflow/utils/logger';
import { type AutoUpdateManager, type UpdateConfig } from '../auto-update-manager';

const logger = createLogger('AutoUpdateIpc');

/**
 * Register all auto-update IPC handlers
 */
export function registerAutoUpdateIpcHandlers(
  manager: AutoUpdateManager,
  mainWindow?: BrowserWindow,
): void {
  logger.info('Registering auto-update IPC handlers...');

  // Initialize with main window if provided
  if (mainWindow) {
    manager.setMainWindow(mainWindow);
  }

  // Check for updates
  ipcMain.handle(AutoUpdateChannels.CHECK, async () => {
    try {
      const result = await manager.checkForUpdates();
      return ok(result);
    } catch (error) {
      logger.error('Failed to check for updates', { error });
      return fail({
        code: 'INTERNAL_ERROR',
        message: (error as Error).message || 'Failed to check for updates',
      });
    }
  });

  // Download update
  ipcMain.handle(AutoUpdateChannels.DOWNLOAD, async () => {
    try {
      const result = await manager.downloadUpdate();
      return ok(result);
    } catch (error) {
      logger.error('Failed to download update', { error });
      return fail({
        code: 'INTERNAL_ERROR',
        message: (error as Error).message || 'Failed to download update',
      });
    }
  });

  // Quit and install
  ipcMain.handle(AutoUpdateChannels.INSTALL, async () => {
    try {
      manager.quitAndInstall();
      return ok(null);
    } catch (error) {
      logger.error('Failed to install update', { error });
      return fail({
        code: 'INTERNAL_ERROR',
        message: (error as Error).message || 'Failed to install update',
      });
    }
  });

  // Get current status
  ipcMain.handle(AutoUpdateChannels.STATUS, async () => {
    try {
      const status = manager.getStatus();
      return ok(status);
    } catch (error) {
      logger.error('Failed to get update status', { error });
      return fail({
        code: 'INTERNAL_ERROR',
        message: (error as Error).message || 'Failed to get update status',
      });
    }
  });

  // Update configuration
  ipcMain.handle(AutoUpdateChannels.CONFIG, async (_, config: Partial<UpdateConfig>) => {
    try {
      manager.updateConfig(config);
      return ok(null);
    } catch (error) {
      logger.error('Failed to update config', { error });
      return fail({
        code: 'INTERNAL_ERROR',
        message: (error as Error).message || 'Failed to update config',
      });
    }
  });

  logger.info('Auto-update IPC handlers registered');
}
