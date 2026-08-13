/**
 * Account module Electron seam.
 *
 * Owns desktop-main registration for the account runtime.
 */
import { ipcMain } from 'electron';
import { ok } from '@memoflow/contracts/result';
import {
  AccountChannels,
  type IElectronModule,
  type IElectronModuleContext,
} from '@memoflow/contracts/electron';
import type {
  CheckAvailabilityReq,
  CloseAccountReq,
  UpdateAccountReq,
  UpdateAccountSettingsReq,
} from '@memoflow/contracts/account';
import { CloseAccountSchema } from '@memoflow/contracts/account';
import { fail } from '@memoflow/contracts/result';
import { formatZodErrors } from '@memoflow/utils/result';
import { createLogger } from '@memoflow/utils/logger';
import {
  createAccountPowerSyncModule,
  PowerSyncAccountRepository,
  type AccountModuleInstance,
  type Transactional,
} from '../server/infrastructure';
import { AccountController } from '../server/transport';
import { withAuthenticatedIdentity } from './authenticated-ipc';
import {
  DesktopAccountProfileSync,
  type DesktopAccountProfileSyncOptions,
} from './desktop-account-profile-sync';

export { Account } from '../server/domain';
export type { IAccountRepository } from '../server/domain';
export { PowerSyncAccountRepository } from '../server/infrastructure';
export type { Transactional } from '../server/infrastructure';

const logger = createLogger('AccountElectron');

const allChannels = Object.values(AccountChannels);

export function createAccountElectronModule(
  syncOptions?: DesktopAccountProfileSyncOptions,
): IElectronModule {
  let activeAccountModule: AccountModuleInstance | null = null;
  let profileSync: DesktopAccountProfileSync | null = null;
  let retryTimer: ReturnType<typeof setInterval> | null = null;

  return {
  name: 'Account',

  register(ctx: IElectronModuleContext): void {
    const accountModule = createAccountPowerSyncModule(ctx.db as unknown as Transactional);
    const controller = new AccountController(accountModule.api);
    activeAccountModule = accountModule;
    accountModule.start();
    if (syncOptions) {
      profileSync = new DesktopAccountProfileSync(
        ctx.db as unknown as Transactional,
        new PowerSyncAccountRepository(ctx.db as unknown as Transactional),
        accountModule.useCases.updateProfile,
        syncOptions,
      );
      void profileSync.flush().catch((error) => {
        logger.warn('Initial Account profile sync failed', { error });
      });
      retryTimer = setInterval(() => {
        void profileSync?.flush().catch((error) => {
          logger.warn('Deferred Account profile sync failed', { error });
        });
      }, 30_000);
      retryTimer.unref?.();
    }

    ipcMain.handle(AccountChannels.GET_ME, async () => {
      return withAuthenticatedIdentity(ctx, (identityId) =>
        controller.getProfile({ identityId }),
      );
    });

    ipcMain.handle(AccountChannels.UPDATE_PROFILE, async (_event, payload: UpdateAccountReq) => {
      return withAuthenticatedIdentity(ctx, (identityId) => profileSync
        ? profileSync.update(payload, identityId)
        : controller.updateProfile(payload, { identityId }));
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
      return withAuthenticatedIdentity(ctx, async (identityId) => {
        if (syncOptions) {
          const parsed = CloseAccountSchema.safeParse(payload);
          if (!parsed.success) {
            return fail({
              code: 'VALIDATION_ERROR',
              message: '参数验证失败',
              details: formatZodErrors(parsed.error.issues),
            });
          }
          if (syncOptions.getCloudAccountId() !== identityId) {
            return fail({ code: 'CLOUD_ACCOUNT_REQUIRED', message: '访客 Profile 无法关闭云端账号' });
          }
          const token = await syncOptions.getCloudAccessToken();
          if (!token) {
            return fail({ code: 'REAUTH_REQUIRED', message: '关闭云端账号前需要重新认证' });
          }
          if (!syncOptions.closeCloudAccount) {
            return fail({ code: 'CLOUD_ACCOUNT_CLOSE_UNAVAILABLE', message: '云端账号关闭能力不可用' });
          }
          if (!syncOptions.markAccountClosing) {
            return fail({ code: 'CLOUD_ACCOUNT_CLOSE_UNAVAILABLE', message: '账号关闭前阻断能力未配置' });
          }
          if (!syncOptions.afterCloudAccountClosed) {
            return fail({ code: 'CLOUD_ACCOUNT_CLOSE_UNAVAILABLE', message: '账号关闭收尾能力未配置' });
          }
          if (!syncOptions.clearAccountClosingMarker) {
            return fail({ code: 'CLOUD_ACCOUNT_CLOSE_UNAVAILABLE', message: '账号关闭回滚能力未配置' });
          }
          // Phase 1 — fail-closed gate: block local new-work (AI/scheduler) the
          // moment the user initiates close, before the cloud saga starts. If
          // this write fails, nothing was marked and the close must NOT proceed;
          // we also do NOT clear (could erase a pre-existing marker).
          try {
            await syncOptions.markAccountClosing();
          } catch (markErr: unknown) {
            const markMsg = markErr instanceof Error ? markErr.message : String(markErr);
            return fail({ code: 'CLOUD_ACCOUNT_CLOSE_FAILED', message: `本地阻断写入失败: ${markMsg}` });
          }
          try {
            const receipt = await syncOptions.closeCloudAccount(token, parsed.data);
            // Phase 3 — cloud close SUCCEEDED. Keep the marker (fail-closed):
            // the local Profile may still be active, so local new-work must stay
            // blocked. A teardown-callback failure is surfaced but must NOT
            // clear the marker.
            try {
              await syncOptions.afterCloudAccountClosed();
            } catch (afterErr: unknown) {
              const afterMsg = afterErr instanceof Error ? afterErr.message : String(afterErr);
              return fail({ code: 'CLOUD_ACCOUNT_CLOSE_TEARDOWN_FAILED', message: afterMsg });
            }
            return ok(receipt);
          } catch (err: unknown) {
            // Phase 2 — cloud close FAILED: the account is NOT closed. Clear the
            // marker (identity-scoped) so local new-work is restored.
            await syncOptions.clearAccountClosingMarker(identityId).catch(() => undefined);
            const msg = err instanceof Error ? err.message : String(err);
            return fail({ code: 'CLOUD_ACCOUNT_CLOSE_FAILED', message: msg });
          }
        }
        return accountModule.api.closeAccount(payload, { identityId });
      });
    });

    logger.info('Account module registered');
  },

  destroy(): void {
    for (const ch of allChannels) {
      ipcMain.removeHandler(ch);
    }
    activeAccountModule?.dispose();
    activeAccountModule = null;
    if (retryTimer) clearInterval(retryTimer);
    retryTimer = null;
    profileSync = null;
    logger.info('Account module destroyed');
  },
  };
}

export const AccountElectronModule = createAccountElectronModule();
