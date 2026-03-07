/**
 * Account Module — Electron Entry Point
 *
 * Self-contained Composition Root for the Account module in Electron main process.
 * Creates an `ElectronAccountRepository` (SQLite) and wires it through `AccountModule`,
 * then registers IPC handlers and cross-module event listeners.
 *
 * Mirrors the API-side `AccountApiModule` pattern.
 *
 * @module account/electron-entry
 */

import { ipcMain } from 'electron';
import type { IElectronModule, IElectronModuleContext } from '@dailyuse/contracts/electron';
import {
  ElectronAccountRepository,
  AccountModule,
  AccountContainer,
} from '../infrastructure-server/sqlite';
import { registerAccountEventListeners } from '../application-server/handlers';
import { createLogger } from '@dailyuse/utils';

const logger = createLogger('AccountElectron');

const Ch = {
  LIST: 'account:list',
  GET: 'account:get',
  GET_CURRENT: 'account:current',
  UPDATE_PROFILE: 'account:update-profile',
  CHECK_AVAILABILITY: 'account:check-availability',
} as const;

const channels = Object.values(Ch);

export const AccountElectronModule: IElectronModule = {
  name: 'Account',

  register(ctx: IElectronModuleContext): void {
    // 1. Composition Root — SQLite repository + AccountModule facade
    const accountRepository = new ElectronAccountRepository(ctx.db);
    const accountModule = new AccountModule({ accountRepository });

    // 2. Cross-module event listeners (auth:identity-created → auto-create account)
    registerAccountEventListeners(accountRepository);

    // 3. IPC Handlers — delegate to AccountModule use cases
    ipcMain.handle(Ch.LIST, (_event, params) => accountModule.accountRepository.findAll(params));

    ipcMain.handle(Ch.GET, (_event, id: string) => accountModule.getProfile.execute(id));

    ipcMain.handle(Ch.GET_CURRENT, (_event, accountId: string) =>
      accountModule.getProfile.execute(accountId),
    );

    ipcMain.handle(Ch.UPDATE_PROFILE, (_event, payload: { accountId: string; data: any }) =>
      accountModule.updateProfile.execute(payload.accountId, payload.data),
    );

    ipcMain.handle(Ch.CHECK_AVAILABILITY, (_event, data: any) =>
      accountModule.checkAvailability.execute(data),
    );

    logger.info('Account module registered');
  },

  destroy(): void {
    for (const ch of channels) {
      ipcMain.removeHandler(ch);
    }
    AccountContainer.getInstance().reset();
    logger.info('Account module destroyed');
  },
};
