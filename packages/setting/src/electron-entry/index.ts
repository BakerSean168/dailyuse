/**
 * Setting Module — Electron Entry Point
 *
 * @module setting/electron-entry
 */

import { ipcMain } from 'electron';
import type { IElectronModule, IElectronModuleContext } from '@dailyuse/contracts/electron';
import { createSettingPowerSyncModule } from '../infrastructure-server/powersync';
import { createLogger } from '@dailyuse/utils';
import type { SettingModuleInstance } from '../infrastructure-server';

const logger = createLogger('SettingElectron');

const Ch = {
  GET_ALL: 'setting:all',
  GET: 'setting:get',
  UPDATE: 'setting:update',
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

    const resolveIdentityId = (payload: unknown): string => {
      if (typeof payload === 'string') return payload;
      if (payload && typeof payload === 'object') {
        const v = payload as Record<string, unknown>;
        return String(v.identityId ?? v.accountId ?? v.id ?? '');
      }
      return '';
    };

    ipcMain.handle(Ch.GET_ALL, (_, params) => mod.api.getUserSetting(resolveIdentityId(params)));
    ipcMain.handle(Ch.GET, (_, params) => mod.api.getUserSetting(resolveIdentityId(params)));
    ipcMain.handle(Ch.UPDATE, (_, dto) => {
      const payload = (dto && typeof dto === 'object' ? dto : {}) as Record<string, unknown>;
      const identityId = resolveIdentityId(dto);
      const category = payload.category as string;
      const patch = (payload.patch as Record<string, unknown>) ?? payload;
      return mod.api.patchUserSetting(identityId, category as any, patch);
    });
    ipcMain.handle(Ch.PATCH, (_, dto) => {
      const payload = (dto && typeof dto === 'object' ? dto : {}) as Record<string, unknown>;
      const identityId = resolveIdentityId(dto);
      const category = payload.category as string;
      const patch = (payload.patch as Record<string, unknown>) ?? {};
      return mod.api.patchUserSetting(identityId, category as any, patch);
    });
    ipcMain.handle(Ch.RESET, (_, params) => {
      const payload = (params && typeof params === 'object' ? params : {}) as Record<
        string,
        unknown
      >;
      const category = typeof payload.category === 'string' ? payload.category : undefined;
      return mod.api.resetUserSetting(resolveIdentityId(params), category);
    });
    ipcMain.handle(Ch.IMPORT, (_, dto) => {
      const payload = (dto && typeof dto === 'object' ? dto : {}) as Record<string, unknown>;
      return mod.api.importSettings(
        resolveIdentityId(dto),
        (payload.data as Record<string, unknown>) ?? payload,
        payload.options as { merge?: boolean; validate?: boolean } | undefined,
      );
    });
    ipcMain.handle(Ch.EXPORT, (_, params) => mod.api.exportSettings(resolveIdentityId(params)));

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
