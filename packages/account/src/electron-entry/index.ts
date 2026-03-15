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
import type { IElectronModule, IElectronModuleContext } from '@dailyuse/contracts/electron';
import type { IpcResult } from '@dailyuse/contracts/result';
import { ok, fail } from '@dailyuse/contracts/result';
import {
  PowerSyncAccountRepository,
  createAccountModule,
  type AccountModuleInstance,
} from '../infrastructure-server';
import { createAccountEventListenerRuntime } from '../application-server/handlers';
import { createLogger } from '@dailyuse/utils';

const logger = createLogger('AccountElectron');

const Ch = {
  LIST: 'account:list',
  GET: 'account:get',
  GET_CURRENT_ALIAS: 'account:current',
  GET_CURRENT: 'account:get-me',
  UPDATE_PROFILE: 'account:update-profile',
  CHECK_AVAILABILITY: 'account:check-availability',
  CLOSE: 'account:close',
} as const;

const channels = Object.values(Ch);
let activeAccountModule: AccountModuleInstance | null = null;

async function withAuth<T>(
  ctx: IElectronModuleContext,
  handler: (identityId: string) => Promise<IpcResult<T>>,
): Promise<IpcResult<T>> {
  try {
    const identityId = await ctx.auth.requireIdentityId();
    return await handler(identityId);
  } catch (error) {
    if (error instanceof Error && error.message === 'AUTH_RESTORING') {
      return fail({ code: 'AUTH_RESTORING', message: 'Authentication restore in progress' });
    }

    return fail({ code: 'AUTH_REQUIRED', message: 'Authentication required' });
  }
}

export const AccountElectronModule: IElectronModule = {
  name: 'Account',

  register(ctx: IElectronModuleContext): void {
    // 1. Composition Root — PowerSync repository + AccountModule facade
    const accountRepository = new PowerSyncAccountRepository(ctx.db as any);
    const accountModule = createAccountModule({
      accountRepository,
      runtimeContributions: createAccountEventListenerRuntime(accountRepository),
    });
    activeAccountModule = accountModule;
    accountModule.start();

    // 3. IPC Handlers — delegate to AccountModule use cases
    ipcMain.handle(Ch.LIST, (_event, params) => accountModule.accountRepository.findAll(params));

    ipcMain.handle(Ch.GET, async () => {
      return withAuth(ctx, async (identityId) => {
        const profile = await accountModule.api.getProfile(identityId);
        if (!profile) {
          return fail({ code: 'ACCOUNT_NOT_FOUND', message: 'Account profile not found' });
        }
        return ok(profile);
      });
    });

    ipcMain.handle(Ch.GET_CURRENT, async () => {
      return withAuth(ctx, async (identityId) => {
        const profile = await accountModule.api.getProfile(identityId);
        if (!profile) {
          return fail({ code: 'ACCOUNT_NOT_FOUND', message: 'Account profile not found' });
        }
        return ok(profile);
      });
    });

    ipcMain.handle(Ch.GET_CURRENT_ALIAS, async () => {
      return withAuth(ctx, async (identityId) => {
        const profile = await accountModule.api.getProfile(identityId);
        if (!profile) {
          return fail({ code: 'ACCOUNT_NOT_FOUND', message: 'Account profile not found' });
        }
        return ok(profile);
      });
    });

    ipcMain.handle(Ch.UPDATE_PROFILE, async (_event, payload: any) => {
      return withAuth(ctx, async (identityId) => {
        const result = await accountModule.api.updateProfile(identityId, payload);
        return ok(result.account);
      });
    });

    ipcMain.handle(Ch.CHECK_AVAILABILITY, (_event, data: any) =>
      accountModule.api.checkAvailability(data),
    );

    ipcMain.handle(Ch.CLOSE, async (_event, payload: any) => {
      return withAuth(ctx, async (identityId) => {
        const result = await accountModule.api.closeAccount(identityId, payload ?? {});
        return ok(result);
      });
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
