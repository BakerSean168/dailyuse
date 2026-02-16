/**
 * Task Module — Electron Entry Point
 *
 * Self-contained Composition Root for the Task module in Electron main process.
 * Delegates to the existing `TaskModule` DI container for repos + services,
 * then registers IPC handlers.
 *
 * @module task/electron-entry
 */

import { ipcMain } from 'electron';
import type { IElectronModule, IElectronModuleContext } from '@dailyuse/contracts/electron';
import { TaskModule } from '../infrastructure-server';
import { createLogger } from '@dailyuse/utils';

const logger = createLogger('TaskElectron');

const Ch = {
  TEMPLATE_LIST: 'task:template:list',
  TEMPLATE_GET: 'task:template:get',
  TEMPLATE_CREATE: 'task:template:create',
  TEMPLATE_UPDATE: 'task:template:update',
  TEMPLATE_DELETE: 'task:template:delete',
  TEMPLATE_ARCHIVE: 'task:template:archive',
  TEMPLATE_RESTORE: 'task:template:restore',
  INSTANCE_LIST: 'task:instance:list',
  INSTANCE_GET: 'task:instance:get',
  INSTANCE_CREATE: 'task:instance:create',
  INSTANCE_UPDATE: 'task:instance:update',
  INSTANCE_DELETE: 'task:instance:delete',
  INSTANCE_COMPLETE: 'task:instance:complete',
  INSTANCE_SKIP: 'task:instance:skip',
  STATISTICS_GET: 'task:statistics:get',
} as const;

const channels = Object.values(Ch);

export const TaskElectronModule: IElectronModule = {
  name: 'Task',

  register(ctx: IElectronModuleContext): void {
    // 1. Composition Root — TaskModule wires repos + use cases internally
    const taskModule = new TaskModule('sqlite', ctx.db);

    // 2. IPC Handlers — delegate to TaskModule's application services
    const svc = taskModule.taskTemplateService;

    ipcMain.handle(Ch.TEMPLATE_LIST, (_, params) => svc.listTemplates(params));
    ipcMain.handle(Ch.TEMPLATE_GET, (_, uuid) => svc.getTemplate(uuid));
    ipcMain.handle(Ch.TEMPLATE_CREATE, (_, dto) => svc.createTemplate(dto));
    ipcMain.handle(Ch.TEMPLATE_UPDATE, (_, dto) => svc.updateTemplate(dto));
    ipcMain.handle(Ch.TEMPLATE_DELETE, (_, uuid) => svc.deleteTemplate(uuid));
    ipcMain.handle(Ch.TEMPLATE_ARCHIVE, (_, uuid) => svc.archiveTemplate(uuid));
    ipcMain.handle(Ch.TEMPLATE_RESTORE, (_, uuid) => svc.restoreTemplate(uuid));

    ipcMain.handle(Ch.INSTANCE_LIST, (_, params) => taskModule.listInstancesByAccount.execute(params));
    ipcMain.handle(Ch.INSTANCE_GET, (_, uuid) => taskModule.getTaskInstance.execute(uuid));
    ipcMain.handle(Ch.INSTANCE_CREATE, (_, dto) => taskModule.startTaskInstance.execute(dto));
    ipcMain.handle(Ch.INSTANCE_DELETE, (_, uuid) => taskModule.deleteTaskInstance.execute(uuid));
    ipcMain.handle(Ch.INSTANCE_COMPLETE, (_, dto) => taskModule.completeTaskInstance.execute(dto));
    ipcMain.handle(Ch.INSTANCE_SKIP, (_, dto) => taskModule.skipTaskInstance.execute(dto));

    ipcMain.handle(Ch.STATISTICS_GET, (_, params) => taskModule.getInstancesByDateRange.execute(params));

    logger.info('Task module registered');
  },

  destroy(): void {
    for (const ch of channels) {
      ipcMain.removeHandler(ch);
    }
    logger.info('Task module destroyed');
  },
};
