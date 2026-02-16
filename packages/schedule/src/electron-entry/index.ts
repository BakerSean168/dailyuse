/**
 * Schedule Module — Electron Entry Point
 *
 * @module schedule/electron-entry
 */

import { ipcMain } from 'electron';
import type { IElectronModule, IElectronModuleContext } from '@dailyuse/contracts/electron';
import { ScheduleModule } from '../infrastructure-server';
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
  STATISTICS_GET: 'schedule:statistics:get',
} as const;

const channels = Object.values(Ch);

export const ScheduleElectronModule: IElectronModule = {
  name: 'Schedule',

  register(ctx: IElectronModuleContext): void {
    const mod = new ScheduleModule('sqlite', ctx.db);

    ipcMain.handle(Ch.LIST, (_, params) => mod.listScheduleTasksByAccount.execute(params));
    ipcMain.handle(Ch.LIST_BY_DATE_RANGE, (_, params) => mod.listScheduleTasksByStatus.execute(params));
    ipcMain.handle(Ch.GET, (_, uuid) => mod.getScheduleTask.execute(uuid));
    ipcMain.handle(Ch.CREATE, (_, dto) => mod.createScheduleTask.execute(dto));
    ipcMain.handle(Ch.UPDATE, (_, dto) => mod.updateScheduleTask.execute(dto));
    ipcMain.handle(Ch.DELETE, (_, uuid) => mod.deleteScheduleTask.execute(uuid));
    ipcMain.handle(Ch.COMPLETE, (_, uuid) => mod.triggerScheduleTask.execute(uuid));
    ipcMain.handle(Ch.CANCEL, (_, uuid) => mod.pauseScheduleTask.execute(uuid));
    ipcMain.handle(Ch.RESCHEDULE, (_, dto) => mod.resumeScheduleTask.execute(dto));
    // TODO: implement when ScheduleStatisticsApplicationService has methods
    // ipcMain.handle(Ch.STATISTICS_GET, (_, params) => mod.scheduleStatisticsService.getStatistics(params));

    logger.info('Schedule module registered');
  },

  destroy(): void {
    for (const ch of channels) {
      ipcMain.removeHandler(ch);
    }
    logger.info('Schedule module destroyed');
  },
};
