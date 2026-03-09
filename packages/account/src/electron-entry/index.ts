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
import { ok, fail } from '@dailyuse/contracts/result';
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
  GET_CURRENT: 'account:get-me',
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

    ipcMain.handle(Ch.GET, async () => {
      const identityId = await ctx.auth.requireIdentityId();
      const profile = await accountModule.getProfile.execute(identityId);
      if (!profile) {
        return fail({ code: 'ACCOUNT_NOT_FOUND', message: 'Account profile not found' });
      }
      return ok(profile);
    });

    ipcMain.handle(Ch.GET_CURRENT, async () => {
      const identityId = await ctx.auth.requireIdentityId();
      const profile = await accountModule.getProfile.execute(identityId);
      if (!profile) {
        return fail({ code: 'ACCOUNT_NOT_FOUND', message: 'Account profile not found' });
      }
      return ok(profile);
    });

    ipcMain.handle(Ch.UPDATE_PROFILE, async (_event, payload: any) => {
      const identityId = await ctx.auth.requireIdentityId();
      const result = await accountModule.updateProfile.execute(identityId, payload);
      return ok(result.account);
    });

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
