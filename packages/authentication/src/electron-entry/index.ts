/**
 * Authentication Module — Electron Entry Point
 *
 * Desktop authentication uses local token/session management
 * (TokenManager + AccountStore) rather than server-side Prisma repositories.
 *
 * @module authentication/electron-entry
 */

import { ipcMain } from 'electron';
import type { IElectronModule, IElectronModuleContext } from '@dailyuse/contracts/electron';
import { createLogger } from '@dailyuse/utils';

const logger = createLogger('AuthenticationElectron');

const Ch = {
  LOGIN: 'auth:login',
  REGISTER: 'auth:register',
  LOGOUT: 'auth:logout',
  GET_CURRENT_USER: 'auth:current-user',
  CHECK_AUTH: 'auth:check',
  REFRESH_TOKEN: 'auth:refresh-token',
} as const;

const channels = Object.values(Ch);

/**
 * The Authentication module in Electron is a thin IPC layer.
 * Actual auth logic lives in the desktop-local TokenManager and AccountStore.
 *
 * TODO: Wire to TokenManager once authentication/infrastructure module is built.
 */
export const AuthenticationElectronModule: IElectronModule = {
  name: 'Authentication',

  register(_ctx: IElectronModuleContext): void {
    // Placeholder — handlers will be populated when TokenManager is implemented
    logger.info('Authentication module registered (stub)');
  },

  destroy(): void {
    for (const ch of channels) {
      ipcMain.removeHandler(ch);
    }
    logger.info('Authentication module destroyed');
  },
};
