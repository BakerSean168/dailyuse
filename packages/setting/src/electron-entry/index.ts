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
  PATCH: 'setting:patch',
  RESET: 'setting:reset',
  IMPORT: 'setting:import',
  EXPORT: 'setting:export',
} as const;

const channels = Object.values(Ch);

export const SettingElectronModule: IElectronModule = {
  name: 'Setting',

  register(ctx: IElectronModuleContext): void {
    // TODO: Desktop 迁移到 Prisma 后去掉 as any
    const mod = new SettingModule('prisma', ctx.db as any);

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
    ipcMain.handle(Ch.PATCH, (_, dto) => {
      const payload = (dto && typeof dto === 'object' ? dto : {}) as Record<string, unknown>;
      const identityId = resolveIdentityId(dto);
      const category = payload.category as string;
      const patch = (payload.patch as Record<string, unknown>) ?? {};
      return mod.patchUserSetting.execute(identityId, category as any, patch);
    });
    ipcMain.handle(Ch.RESET, (_, params) => {
      const payload = (params && typeof params === 'object' ? params : {}) as Record<string, unknown>;
      const category = typeof payload.category === 'string' ? payload.category : undefined;
      return mod.resetUserSetting.execute(resolveIdentityId(params), category);
    });
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
