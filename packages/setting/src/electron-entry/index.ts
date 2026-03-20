/**
 * Setting Module — Electron Entry Point
 *
 * @module setting/electron-entry
 */

import { ipcMain } from 'electron';
import {
  type IElectronModule,
  type IElectronModuleContext,
  withAuthenticatedIdentity,
} from '@dailyuse/contracts/electron';
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

export const SettingElectronModule: IElectronModule = {
  name: 'Setting',

  register(ctx: IElectronModuleContext): void {
    const mod = createSettingPowerSyncModule(ctx.db);
    activeSettingModule = mod;
    mod.start();

    ipcMain.handle(Ch.GET_ALL, () =>
      withAuthenticatedIdentity(ctx, (identityId) => mod.api.getUserSetting(identityId)),
    );

    ipcMain.handle(Ch.PATCH, (_, dto) => {
      const payload = (dto && typeof dto === 'object' ? dto : {}) as Record<string, unknown>;
      const category = payload.category as string;
      const patch = (payload.patch as Record<string, unknown>) ?? {};
      return withAuthenticatedIdentity(ctx, (identityId) =>
        mod.api.patchUserSetting(identityId, category as any, patch),
      );
    });

    ipcMain.handle(Ch.RESET, (_, params) => {
      const payload = (params && typeof params === 'object' ? params : {}) as Record<
        string,
        unknown
      >;
      const category = typeof payload.category === 'string' ? payload.category : undefined;
      return withAuthenticatedIdentity(ctx, (identityId) =>
        mod.api.resetUserSetting(identityId, category),
      );
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
      return withAuthenticatedIdentity(ctx, (identityId) =>
        mod.api.importSettings(identityId, data, options),
      );
    });

    ipcMain.handle(Ch.EXPORT, () =>
      withAuthenticatedIdentity(ctx, async (identityId) => {
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
