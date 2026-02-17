/**
 * Setting Module — Electron Entry Point
 *
 * @module setting/electron-entry
 */

import { ipcMain } from 'electron';
import type { IElectronModule, IElectronModuleContext } from '@dailyuse/contracts/electron';
import { SettingModule } from '../infrastructure-server';
import { SettingContainer } from '../infrastructure-server/di/setting-container';
import { createLogger } from '@dailyuse/utils';

const logger = createLogger('SettingElectron');

const Ch = {
  GET_ALL: 'setting:all',
  GET: 'setting:get',
  UPDATE: 'setting:update',
  RESET: 'setting:reset',
  IMPORT: 'setting:import',
  EXPORT: 'setting:export',
} as const;

const channels = Object.values(Ch);

export const SettingElectronModule: IElectronModule = {
  name: 'Setting',

  register(ctx: IElectronModuleContext): void {
    const mod = new SettingModule('sqlite', ctx.db);

    const resolveIdentityId = (payload: unknown): string => {
      if (typeof payload === 'string') return payload;
      if (payload && typeof payload === 'object') {
        const v = payload as Record<string, unknown>;
        return String(v.identityId ?? v.accountId ?? v.id ?? '');
      }
      return '';
    };

    ipcMain.handle(Ch.GET_ALL, (_, params) => mod.getUserSetting.execute(resolveIdentityId(params)));
    ipcMain.handle(Ch.GET, (_, params) => mod.getUserSetting.execute(resolveIdentityId(params)));
    ipcMain.handle(Ch.UPDATE, (_, dto) => {
      const identityId = resolveIdentityId(dto);
      const payload = (dto && typeof dto === 'object' ? dto : {}) as Record<string, unknown>;
      const section = typeof payload.section === 'string' ? payload.section : undefined;
      const updates = (payload.updates as Record<string, unknown> | undefined)
        ?? (payload.settings as Record<string, unknown> | undefined)
        ?? (section ? { [section]: payload } : payload);
      return mod.updateUserSetting.execute(identityId, updates as any);
    });
    ipcMain.handle(Ch.RESET, (_, params) => mod.resetUserSetting.execute(resolveIdentityId(params)));
    ipcMain.handle(Ch.IMPORT, (_, dto) => {
      const payload = (dto && typeof dto === 'object' ? dto : {}) as Record<string, unknown>;
      return mod.importSettings.execute(
        resolveIdentityId(dto),
        (payload.data as Record<string, unknown>) ?? payload,
        (payload.options as { merge?: boolean; validate?: boolean } | undefined),
      );
    });
    ipcMain.handle(Ch.EXPORT, (_, params) => mod.exportSettings.execute(resolveIdentityId(params)));

    logger.info('Setting module registered');
  },

  destroy(): void {
    for (const ch of channels) {
      ipcMain.removeHandler(ch);
    }
    SettingContainer.getInstance().reset();
    logger.info('Setting module destroyed');
  },
};
