/**
 * Account Module — Electron Entry Point
 *
 * Self-contained Composition Root for the Account module in Electron main process.
 * Creates a PowerSync-backed account repository and wires it through `AccountModule`,
 * then registers IPC handlers and cross-module event listeners.
 *
 * Mirrors the API-side `AccountApiModule` pattern.
 *
 * @module account/electron-entry
 */

import { ipcMain } from 'electron';
import {
  type IElectronModule,
  type IElectronModuleContext,
} from '@dailyuse/contracts/electron';
import type {
  UpdateAccountReq,
  UpdateAccountSettingsReq,
  CheckAvailabilityReq,
  CloseAccountReq,
} from '@dailyuse/contracts/account';
import {
  PowerSyncAccountRepository,
  createAccountModule,
  type AccountModuleInstance,
  type Transactional,
} from '../infrastructure-server';
import { createAccountEventListenerRuntime } from '../application-server/handlers';
import { createLogger } from '@dailyuse/utils/logger';
import { withAuthenticatedIdentity } from './authenticated-ipc';

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
    // 1. Composition Root — PowerSync repository + AccountModule facade
    const accountRepository = new PowerSyncAccountRepository(ctx.db as unknown as Transactional);
    const accountModule = createAccountModule({
      accountRepository,
      runtimeContributions: createAccountEventListenerRuntime(accountRepository),
    });
    activeAccountModule = accountModule;
    accountModule.start();

    // 3. IPC Handlers — delegate to AccountModule use cases
    ipcMain.handle(Ch.LIST, (_event, params) => accountModule.accountRepository.findAll(params));

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
