/**
 * Account Module — Electron Entry Point
 *
 * Account management in the desktop app uses local file-based storage
 * (AccountStore) rather than SQLite repositories. This module registers
 * the IPC handlers for account operations.
 *
 * @module account/electron-entry
 */

import { ipcMain } from 'electron';
import type { IElectronModule, IElectronModuleContext } from '@dailyuse/contracts/electron';
import { AccountContainer } from '../infrastructure-server/di/account-container';
import { createLogger } from '@dailyuse/utils';

const logger = createLogger('AccountElectron');

const Ch = {
  LIST: 'account:list',
  GET: 'account:get',
  GET_CURRENT: 'account:current',
  UPDATE_PROFILE: 'account:update-profile',
  GET_STATS: 'account:stats',
} as const;

const channels = Object.values(Ch);

/**
 * The Account module in Electron is a thin IPC layer.
 * Actual account persistence is handled by the desktop-local AccountStore.
 *
 * TODO: Wire to AccountStore once authentication/infrastructure module is built.
 */
export const AccountElectronModule: IElectronModule = {
  name: 'Account',

  register(_ctx: IElectronModuleContext): void {
    // Placeholder — handlers will be populated when AccountStore is implemented
    logger.info('Account module registered (stub)');
  },

  destroy(): void {
    for (const ch of channels) {
      ipcMain.removeHandler(ch);
    }
    AccountContainer.getInstance().reset();
    logger.info('Account module destroyed');
  },
};
