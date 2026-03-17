/**
 * Setting Module — Electron Entry Point
 *
 * @module setting/electron-entry
 */

import { ipcMain } from 'electron';
import type { IElectronModule, IElectronModuleContext } from '@dailyuse/contracts/electron';
import type { IpcResult } from '@dailyuse/contracts/result';
import { ok, fail } from '@dailyuse/contracts/result';
import { createSettingPowerSyncModule } from '../infrastructure-server/powersync';
import { createLogger } from '@dailyuse/utils';
import type { SettingModuleInstance } from '../infrastructure-server';

const logger = createLogger('SettingElectron');

const Ch = {
  GET_ALL: 'setting:all',
  PATCH: 'setting:patch',
  RESET: 'setting:reset',
  IMPORT: 'setting:import',
  EXPORT: 'setting:export',
} as const;

const channels = Object.values(Ch);
let activeSettingModule: SettingModuleInstance | null = null;

function isIpcResult<T>(value: unknown): value is IpcResult<T> {
  return (
    typeof value === 'object' &&
    value !== null &&
    'ok' in value &&
    typeof (value as { ok?: unknown }).ok === 'boolean' &&
    ('data' in value || 'error' in value)
  );
}

/**
 * Resolves identityId from the shared auth context.
 * Falls back to empty string for offline/guest mode rather than throwing.
 */
async function withAuth<T>(
  ctx: IElectronModuleContext,
  handler: (identityId: string) => Promise<T>,
): Promise<IpcResult<T>> {
  try {
    const identityId = await ctx.auth.requireIdentityId();
    const result = await handler(identityId);
    return isIpcResult<T>(result) ? result : ok(result);
  } catch (error) {
    if (error instanceof Error && error.message === 'AUTH_RESTORING') {
      return fail({ code: 'AUTH_RESTORING', message: 'Authentication restore in progress' });
    }
    return fail({ code: 'AUTH_REQUIRED', message: 'Authentication required' });
  }
}

export const SettingElectronModule: IElectronModule = {
  name: 'Setting',

  register(ctx: IElectronModuleContext): void {
    const mod = createSettingPowerSyncModule(ctx.db);
    activeSettingModule = mod;
    mod.start();

    ipcMain.handle(Ch.GET_ALL, () =>
      withAuth(ctx, (identityId) => mod.api.getUserSetting(identityId)),
    );

    ipcMain.handle(Ch.PATCH, (_, dto) => {
      const payload = (dto && typeof dto === 'object' ? dto : {}) as Record<string, unknown>;
      const category = payload.category as string;
      const patch = (payload.patch as Record<string, unknown>) ?? {};
      return withAuth(ctx, (identityId) =>
        mod.api.patchUserSetting(identityId, category as any, patch),
      );
    });

    ipcMain.handle(Ch.RESET, (_, params) => {
      const payload = (params && typeof params === 'object' ? params : {}) as Record<
        string,
        unknown
      >;
      const category = typeof payload.category === 'string' ? payload.category : undefined;
      return withAuth(ctx, (identityId) => mod.api.resetUserSetting(identityId, category));
    });

    ipcMain.handle(Ch.IMPORT, (_, dto) => {
      const payload = (dto && typeof dto === 'object' ? dto : {}) as Record<string, unknown>;
      const raw = payload.data;
      // The adapter sends a JSON string; parse it into the Record the use case expects.
      const data: Record<string, unknown> =
        typeof raw === 'string'
          ? (JSON.parse(raw) as Record<string, unknown>)
          : ((raw as Record<string, unknown>) ?? {});
      const options = payload.options as { merge?: boolean } | undefined;
      return withAuth(ctx, (identityId) => mod.api.importSettings(identityId, data, options));
    });

    ipcMain.handle(Ch.EXPORT, () =>
      withAuth(ctx, async (identityId) => {
        const exported = await mod.api.exportSettings(identityId);
        return JSON.stringify(exported);
      }),
    );

    logger.info('Setting module registered');
  },

  destroy(): void {
    for (const ch of channels) {
      ipcMain.removeHandler(ch);
    }
    activeSettingModule?.dispose();
    activeSettingModule = null;
    logger.info('Setting module destroyed');
  },
};
