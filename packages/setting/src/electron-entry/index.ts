/**
 * Setting Module — Electron Entry Point
 *
 * @module setting/electron-entry
 */

import { ipcMain } from 'electron';
import type { IElectronModule, IElectronModuleContext } from '@dailyuse/contracts/electron';
import { SettingModule } from '../infrastructure-server';
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

    ipcMain.handle(Ch.GET_ALL, (_, params) => mod.getUserSetting.execute(params));
    ipcMain.handle(Ch.GET, (_, params) => mod.getUserSetting.execute(params));
    ipcMain.handle(Ch.UPDATE, (_, dto) => mod.updateUserSetting.execute(dto));
    ipcMain.handle(Ch.RESET, (_, params) => mod.resetUserSetting.execute(params));
    ipcMain.handle(Ch.IMPORT, (_, dto) => mod.importSettings.execute(dto));
    ipcMain.handle(Ch.EXPORT, (_, params) => mod.exportSettings.execute(params));

    logger.info('Setting module registered');
  },

  destroy(): void {
    for (const ch of channels) {
      ipcMain.removeHandler(ch);
    }
    logger.info('Setting module destroyed');
  },
};
