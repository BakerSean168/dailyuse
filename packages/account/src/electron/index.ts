/**
 * Account module Electron seam.
 *
 * Owns desktop-main registration for the account runtime.
 */
import { ipcMain } from 'electron';
import {
  AccountChannels,
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
  type AccountModuleInstance,
  type Transactional,
} from '../server/infrastructure';
import { AccountController } from '../server/transport';
import { withAuthenticatedIdentity } from './authenticated-ipc';

export { Account } from '../server/domain';
export type { IAccountRepository } from '../server/domain';
export { PowerSyncAccountRepository } from '../server/infrastructure';
export type { Transactional } from '../server/infrastructure';

const logger = createLogger('AccountElectron');

const allChannels = Object.values(AccountChannels);
let activeAccountModule: AccountModuleInstance | null = null;

export const AccountElectronModule: IElectronModule = {
  name: 'Account',

  register(ctx: IElectronModuleContext): void {
    const accountModule = createAccountPowerSyncModule(ctx.db as unknown as Transactional);
    const controller = new AccountController(accountModule.api);
    activeAccountModule = accountModule;
    accountModule.start();

    ipcMain.handle(AccountChannels.GET_ME, async () => {
      return withAuthenticatedIdentity(ctx, (identityId) =>
        controller.getProfile({ identityId }),
      );
    });

    ipcMain.handle(AccountChannels.UPDATE_PROFILE, async (_event, payload: UpdateAccountReq) => {
      return withAuthenticatedIdentity(ctx, (identityId) =>
        accountModule.api.updateProfile(payload, { identityId }),
      );
    });

    ipcMain.handle(AccountChannels.UPDATE_SETTINGS, async (_event, payload: UpdateAccountSettingsReq) => {
      return withAuthenticatedIdentity(ctx, (identityId) =>
        accountModule.api.updateSettings(payload, { identityId }),
      );
    });

    ipcMain.handle(AccountChannels.CHECK_AVAILABILITY, (_event, data: CheckAvailabilityReq) =>
      accountModule.api.checkAvailability(data),
    );

    ipcMain.handle(AccountChannels.CLOSE, async (_event, payload: CloseAccountReq) => {
      return withAuthenticatedIdentity(ctx, (identityId) =>
        accountModule.api.closeAccount(payload, { identityId }),
      );
    });

    logger.info('Account module registered');
  },

  destroy(): void {
    for (const ch of allChannels) {
      ipcMain.removeHandler(ch);
    }
    activeAccountModule?.dispose();
    activeAccountModule = null;
    logger.info('Account module destroyed');
  },
};
