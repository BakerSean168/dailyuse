/**
 * Authentication Module — Electron Entry Point
 *
 * Legacy shared Electron entry for the Authentication package.
 *
 * Desktop now owns auth runtime composition from
 * `apps/desktop/src/main/modules/authentication/desktop-auth.electron-module.ts`
 * so this package entry no longer wires the old SQLite repositories against the
 * shared `IElectronDatabase` contract.
 *
 * @module authentication/electron-entry
 */

import { ipcMain } from 'electron';
import type { IElectronModule, IElectronModuleContext } from '@dailyuse/contracts/electron';
import { AuthenticationContainer } from '../infrastructure-server';
import { fail } from '@dailyuse/contracts/result';
import { createLogger } from '@dailyuse/utils';

const logger = createLogger('AuthenticationElectron');

const Ch = {
  LOGIN: 'auth:login',
  REGISTER: 'auth:register',
  LOGOUT: 'auth:logout',
  GET_CURRENT_USER: 'auth:get-current-user',
  CHECK_AUTH: 'auth:check',
  REFRESH_TOKEN: 'auth:refresh-token',
} as const;

const channels = Object.values(Ch);

export const AuthenticationElectronModule: IElectronModule = {
  name: 'Authentication',

  register(_ctx: IElectronModuleContext): void {
    const message =
      'AuthenticationElectronModule is deprecated for desktop PowerSync runtime. Use apps/desktop desktop-auth.electron-module instead.';

    for (const channel of channels) {
      ipcMain.handle(channel, async () => fail({ code: 'NOT_SUPPORTED', message }));
    }

    logger.warn(message);
  },

  destroy(): void {
    for (const ch of channels) {
      ipcMain.removeHandler(ch);
    }
    AuthenticationContainer.getInstance().reset();
    logger.info('Authentication module destroyed');
  },
};
