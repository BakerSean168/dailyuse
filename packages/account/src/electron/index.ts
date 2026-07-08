/**
 * Account module Electron seam.
 *
 * Owns desktop-main registration for the account runtime.
 */
import { ipcMain } from 'electron';
import {
  type IElectronModule,
  type IElectronModuleContext,
} from '@dailyuse/contracts/electron';
import type {
  CheckAvailabilityReq,
  CloseAccountReq,
  UpdateAccountReq,
  UpdateAccountSettingsReq,
} from '@dailyuse/contracts/account';
import { createLogger } from '@dailyuse/utils/logger';
import {
  createAccountPowerSyncModule,
  type AccountListOptions,
  type AccountModuleInstance,
  type Transactional,
} from '../server/infrastructure';
import { withAuthenticatedIdentity } from './authenticated-ipc';

export { Account } from '../server/domain';
export type { IAccountRepository } from '../server/domain';
export { PowerSyncAccountRepository } from '../server/infrastructure';
export type { Transactional } from '../server/infrastructure';

const logger = createLogger('AccountElectron');

const Ch = {
  LIST: 'account:list',
  GET: 'account:get',
  GET_CURRENT_ALIAS: 'account:current',
  GET_CURRENT: 'account:get-me',
  UPDATE_PROFILE: 'account:update-profile',
  UPDATE_SETTINGS: 'account:update-settings',
  CHECK_AVAILABILITY: 'account:check-availability',
  CLOSE: 'account:close',
} as const;

const channels = Object.values(Ch);
let activeAccountModule: AccountModuleInstance | null = null;

export const AccountElectronModule: IElectronModule = {
  name: 'Account',

  register(ctx: IElectronModuleContext): void {
    const accountModule = createAccountPowerSyncModule(ctx.db as unknown as Transactional);
    activeAccountModule = accountModule;
    accountModule.start();

    ipcMain.handle(Ch.LIST, (_event, params) =>
      accountModule.api.listAccounts(params as AccountListOptions | undefined),
    );

    ipcMain.handle(Ch.GET, async () => {
      return withAuthenticatedIdentity(ctx, (identityId) =>
        accountModule.api.getProfile({ identityId }),
      );
    });

    ipcMain.handle(Ch.GET_CURRENT, async () => {
      return withAuthenticatedIdentity(ctx, (identityId) =>
        accountModule.api.getProfile({ identityId }),
      );
    });

    ipcMain.handle(Ch.GET_CURRENT_ALIAS, async () => {
      return withAuthenticatedIdentity(ctx, (identityId) =>
        accountModule.api.getProfile({ identityId }),
      );
    });

    ipcMain.handle(Ch.UPDATE_PROFILE, async (_event, payload: UpdateAccountReq) => {
      return withAuthenticatedIdentity(ctx, (identityId) =>
        accountModule.api.updateProfile(payload, { identityId }),
      );
    });

    ipcMain.handle(Ch.UPDATE_SETTINGS, async (_event, payload: UpdateAccountSettingsReq) => {
      return withAuthenticatedIdentity(ctx, (identityId) =>
        accountModule.api.updateSettings(payload, { identityId }),
      );
    });

    ipcMain.handle(Ch.CHECK_AVAILABILITY, (_event, data: CheckAvailabilityReq) =>
      accountModule.api.checkAvailability(data),
    );

    ipcMain.handle(Ch.CLOSE, async (_event, payload: CloseAccountReq) => {
      return withAuthenticatedIdentity(ctx, (identityId) =>
        accountModule.api.closeAccount(payload, { identityId }),
      );
    });

    logger.info('Account module registered');
  },

  destroy(): void {
    for (const ch of channels) {
      ipcMain.removeHandler(ch);
    }
    activeAccountModule?.dispose();
    activeAccountModule = null;
    logger.info('Account module destroyed');
  },
};
