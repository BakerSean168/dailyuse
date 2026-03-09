/**
 * Schedule Module — Electron Entry Point
 *
 * @module schedule/electron-entry
 */

import { ipcMain } from 'electron';
import type { IElectronModule, IElectronModuleContext } from '@dailyuse/contracts/electron';
import { ScheduleSqliteModule, ScheduleContainer } from '../infrastructure-server/sqlite';
import { createLogger } from '@dailyuse/utils';
import { ScheduleEventController } from '../controllers/schedule-event.controller';
import { withAuthenticatedValue } from './authenticated-ipc';

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
    const eventController = new ScheduleEventController({
      scheduleEventService: mod.scheduleEventService,
    });

    ipcMain.handle(Ch.LIST, async () =>
      withAuthenticatedValue(ctx, async (requestContext) =>
        eventController.getByTimeRange(
          { startTime: 0, endTime: Number.MAX_SAFE_INTEGER, identityId: requestContext.identityId },
          requestContext,
        ),
      ),
    );
    ipcMain.handle(Ch.LIST_BY_DATE_RANGE, async (_event, params) =>
      withAuthenticatedValue(ctx, async (requestContext) =>
        eventController.getByTimeRange(params ?? {}, requestContext),
      ),
    );
    ipcMain.handle(Ch.GET, (_event, id) => eventController.get(id));
    ipcMain.handle(Ch.CREATE, async (_event, dto) =>
      withAuthenticatedValue(ctx, async (requestContext) =>
        eventController.create(dto, requestContext),
      ),
    );
    ipcMain.handle(Ch.UPDATE, (_event, id, dto) => eventController.update(id, dto));
    ipcMain.handle(Ch.DELETE, (_event, id) => eventController.delete(id));
    ipcMain.handle(Ch.COMPLETE, () => {
      throw new Error('schedule:complete is not supported for schedule events');
    });
    ipcMain.handle(Ch.CANCEL, () => {
      throw new Error('schedule:cancel is not supported for schedule events');
    });
    ipcMain.handle(Ch.RESCHEDULE, () => {
      throw new Error('schedule:reschedule is not supported for schedule events');
    });

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
