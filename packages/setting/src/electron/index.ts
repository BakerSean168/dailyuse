/**
 * Setting module Electron seam.
 *
 * Owns desktop-main registration for the setting runtime.
 */
import { ipcMain } from 'electron';
import {
  SettingChannels,
  type IElectronModule,
  type IElectronModuleContext,
} from '@memoflow/contracts/electron';
import type { PreferenceCategory } from '@memoflow/contracts/setting';
import { createLogger } from '@memoflow/utils/logger';
import { createSettingPowerSyncModule, type SettingModuleInstance } from '../server/infrastructure';
import { withAuthenticatedIdentity } from './authenticated-ipc';

const logger = createLogger('SettingElectron');

const allChannels = Object.values(SettingChannels);
let activeSettingModule: SettingModuleInstance | null = null;

export const SettingElectronModule: IElectronModule = {
  name: 'Setting',

  register(ctx: IElectronModuleContext): void {
    const mod = createSettingPowerSyncModule(ctx.db);
    activeSettingModule = mod;
    mod.start();

    ipcMain.handle(SettingChannels.GET_ALL, () =>
      withAuthenticatedIdentity(ctx, (identityId) => mod.api.getUserSetting(identityId)),
    );

    ipcMain.handle(SettingChannels.GET_DEFAULTS, () =>
      Promise.resolve(mod.api.getDefaultSettings()),
    );

    ipcMain.handle(SettingChannels.PATCH, (_event, dto) => {
      const payload = (dto && typeof dto === 'object' ? dto : {}) as Record<string, unknown>;
      const category = payload.category as string;
      const patch = (payload.patch as Record<string, unknown>) ?? {};
      return withAuthenticatedIdentity(ctx, (identityId) =>
        mod.api.patchUserSetting(identityId, category as PreferenceCategory, patch),
      );
    });

    ipcMain.handle(SettingChannels.RESET, (_event, params) => {
      const payload = (params && typeof params === 'object' ? params : {}) as Record<
        string,
        unknown
      >;
      const category = typeof payload.category === 'string' ? payload.category : undefined;
      return withAuthenticatedIdentity(ctx, (identityId) =>
        mod.api.resetUserSetting(identityId, category),
      );
    });

    ipcMain.handle(SettingChannels.IMPORT, (_event, dto) => {
      const payload = (dto && typeof dto === 'object' ? dto : {}) as Record<string, unknown>;
      const raw = payload.data;
      const data: Record<string, unknown> =
        typeof raw === 'string'
          ? (JSON.parse(raw) as Record<string, unknown>)
          : ((raw as Record<string, unknown>) ?? {});
      const options = payload.options as { merge?: boolean } | undefined;
      return withAuthenticatedIdentity(ctx, (identityId) =>
        mod.api.importSettings(identityId, data, options),
      );
    });

    ipcMain.handle(SettingChannels.EXPORT, () =>
      withAuthenticatedIdentity(ctx, async (identityId) => {
        const exported = await mod.api.exportSettings(identityId);
        return JSON.stringify(exported);
      }),
    );

    logger.info('Setting module registered');
  },

  destroy(): void {
    for (const ch of allChannels) {
      ipcMain.removeHandler(ch);
    }
    activeSettingModule?.dispose();
    activeSettingModule = null;
    logger.info('Setting module destroyed');
  },
};
