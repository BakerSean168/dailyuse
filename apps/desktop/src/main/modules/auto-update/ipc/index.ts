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
import { createLogger } from '@dailyuse/utils/logger';
import { getAutoUpdateManager, type UpdateConfig } from '../auto-update-manager';

const logger = createLogger('AutoUpdateIpc');

/**
 * Register all auto-update IPC handlers
 */
export function registerAutoUpdateIpcHandlers(mainWindow?: BrowserWindow): void {
  logger.info('Registering auto-update IPC handlers...');

  const manager = getAutoUpdateManager();

  // Initialize with main window if provided
  if (mainWindow) {
    manager.setMainWindow(mainWindow);
  }

  // Check for updates
  ipcMain.handle('auto-update:check', async () => {
    try {
      const result = await manager.checkForUpdates();
      return { success: true, data: result };
    } catch (error) {
      logger.error('Failed to check for updates', { error });
      return { success: false, error: (error as Error).message };
    }
  });

  // Download update
  ipcMain.handle('auto-update:download', async () => {
    try {
      const result = await manager.downloadUpdate();
      return { success: result };
    } catch (error) {
      logger.error('Failed to download update', { error });
      return { success: false, error: (error as Error).message };
    }
  });

  // Quit and install
  ipcMain.handle('auto-update:install', async () => {
    try {
      manager.quitAndInstall();
      return { success: true };
    } catch (error) {
      logger.error('Failed to install update', { error });
      return { success: false, error: (error as Error).message };
    }
  });

  // Get current status
  ipcMain.handle('auto-update:status', async () => {
    try {
      const status = manager.getStatus();
      return { success: true, data: status };
    } catch (error) {
      logger.error('Failed to get update status', { error });
      return { success: false, error: (error as Error).message };
    }
  });

  // Update configuration
  ipcMain.handle('auto-update:config', async (_, config: Partial<UpdateConfig>) => {
    try {
      manager.updateConfig(config);
      return { success: true };
    } catch (error) {
      logger.error('Failed to update config', { error });
      return { success: false, error: (error as Error).message };
    }
  });

  logger.info('Auto-update IPC handlers registered');
}
