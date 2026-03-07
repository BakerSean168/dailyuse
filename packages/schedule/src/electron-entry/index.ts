/**
 * Schedule Module — Electron Entry Point
 *
 * @module schedule/electron-entry
 */

import { ipcMain } from 'electron';
import type { IElectronModule, IElectronModuleContext } from '@dailyuse/contracts/electron';
import { ScheduleSqliteModule, ScheduleContainer } from '../infrastructure-server/sqlite';
import { createLogger } from '@dailyuse/utils';

const logger = createLogger('ScheduleElectron');

const Ch = {
  LIST: 'schedule:list',
  LIST_BY_DATE_RANGE: 'schedule:list-by-date-range',
  GET: 'schedule:get',
  CREATE: 'schedule:create',
  UPDATE: 'schedule:update',
  DELETE: 'schedule:delete',
  COMPLETE: 'schedule:complete',
  CANCEL: 'schedule:cancel',
  RESCHEDULE: 'schedule:reschedule',
} as const;

const channels = Object.values(Ch);

export const ScheduleElectronModule: IElectronModule = {
  name: 'Schedule',

  register(ctx: IElectronModuleContext): void {
    const mod = new ScheduleSqliteModule(ctx.db);

    ipcMain.handle(Ch.LIST, (_, params) => mod.listScheduleTasksByAccount.execute(params));
    ipcMain.handle(Ch.LIST_BY_DATE_RANGE, (_, params) =>
      mod.listScheduleTasksByStatus.execute(params),
    );
    ipcMain.handle(Ch.GET, (_, id) => mod.getScheduleTask.execute(id));
    ipcMain.handle(Ch.CREATE, (_, dto) => mod.createScheduleTask.execute(dto));
    ipcMain.handle(Ch.UPDATE, (_, dto) => mod.updateScheduleTask.execute(dto));
    ipcMain.handle(Ch.DELETE, (_, id) => mod.deleteScheduleTask.execute(id));
    ipcMain.handle(Ch.COMPLETE, (_, id) => mod.triggerScheduleTask.execute(id));
    ipcMain.handle(Ch.CANCEL, (_, id) => mod.pauseScheduleTask.execute(id));
    ipcMain.handle(Ch.RESCHEDULE, (_, dto) => mod.resumeScheduleTask.execute(dto));

    logger.info('Schedule module registered');
  },

  destroy(): void {
    for (const ch of channels) {
      ipcMain.removeHandler(ch);
    }
    ScheduleContainer.getInstance().reset();
    logger.info('Schedule module destroyed');
  },
};
