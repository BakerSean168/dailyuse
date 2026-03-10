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
import { TaskPowerSyncModule, TaskContainer } from '../infrastructure-server/powersync';
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
  TEMPLATE_PAUSE: 'task:template:pause',
  TEMPLATE_GENERATE_INSTANCES: 'task:template:generate-instances',
  TEMPLATE_GET_INSTANCES: 'task:template:get-instances',
  TEMPLATE_GET_BY_PRIORITY: 'task:template:get-by-priority',
  TEMPLATE_BIND_GOAL: 'task:template:bind-goal',
  TEMPLATE_UNBIND_GOAL: 'task:template:unbind-goal',
  INSTANCE_LIST: 'task:instance:list',
  INSTANCE_GET: 'task:instance:get',
  INSTANCE_CREATE: 'task:instance:create',
  INSTANCE_UPDATE: 'task:instance:update',
  INSTANCE_DELETE: 'task:instance:delete',
  INSTANCE_COMPLETE: 'task:instance:complete',
  INSTANCE_SKIP: 'task:instance:skip',
  INSTANCE_CHECK_EXPIRED: 'task:instance:check-expired',
} as const;

const channels = Object.values(Ch);

export const TaskElectronModule: IElectronModule = {
  name: 'Task',

  register(ctx: IElectronModuleContext): void {
    // 1. Composition Root — TaskModule wires repos + use cases internally
    const taskModule = new TaskPowerSyncModule(ctx.db as any);

    // 2. IPC Handlers — delegate to TaskModule use cases
    ipcMain.handle(Ch.TEMPLATE_LIST, (_, params) => taskModule.listTaskTemplates.execute(params));
    ipcMain.handle(Ch.TEMPLATE_GET, (_, payload) =>
      taskModule.getTaskTemplate.execute(payload?.id ?? payload, payload?.includeChildren ?? false),
    );
    ipcMain.handle(Ch.TEMPLATE_CREATE, (_, dto) => taskModule.createTaskTemplate.execute(dto));
    ipcMain.handle(Ch.TEMPLATE_UPDATE, (_, payload) =>
      taskModule.updateTaskTemplate.execute(payload?.id, payload),
    );
    ipcMain.handle(Ch.TEMPLATE_DELETE, (_, payload) =>
      taskModule.deleteTaskTemplate.execute(payload?.id ?? payload),
    );
    ipcMain.handle(Ch.TEMPLATE_ARCHIVE, (_, payload) =>
      taskModule.archiveTaskTemplate.execute(payload?.id ?? payload),
    );
    ipcMain.handle(Ch.TEMPLATE_RESTORE, (_, payload) =>
      taskModule.activateTaskTemplate.execute(payload?.id ?? payload),
    );
    ipcMain.handle(Ch.TEMPLATE_PAUSE, (_, payload) =>
      taskModule.pauseTaskTemplate.execute(payload?.id ?? payload),
    );
    ipcMain.handle(Ch.TEMPLATE_GENERATE_INSTANCES, (_, payload) =>
      taskModule.generateTaskInstances.execute(payload?.templateId, payload?.request),
    );
    ipcMain.handle(Ch.TEMPLATE_GET_INSTANCES, (_, payload) =>
      taskModule.listTaskInstancesByTemplate.execute(payload?.templateId),
    );
    ipcMain.handle(Ch.TEMPLATE_GET_BY_PRIORITY, (_, payload) =>
      taskModule.listTaskTemplatesByPriority.execute(
        payload?.identityId ?? '',
        payload?.params?.limit,
      ),
    );
    ipcMain.handle(Ch.TEMPLATE_BIND_GOAL, (_, payload) =>
      taskModule.bindTaskToGoal.execute(payload?.templateId, payload?.request),
    );
    ipcMain.handle(Ch.TEMPLATE_UNBIND_GOAL, (_, payload) =>
      taskModule.unbindTaskFromGoal.execute(payload?.templateId),
    );

    ipcMain.handle(Ch.INSTANCE_LIST, (_, params) =>
      taskModule.listTaskInstancesByAccount.execute(params),
    );
    ipcMain.handle(Ch.INSTANCE_GET, (_, payload) =>
      taskModule.getTaskInstance.execute(payload?.id ?? payload),
    );
    ipcMain.handle(Ch.INSTANCE_CREATE, (_, payload) =>
      taskModule.startTaskInstance.execute(payload?.id ?? payload),
    );
    ipcMain.handle(Ch.INSTANCE_UPDATE, () => {
      throw new Error('task:instance:update is not supported');
    });
    ipcMain.handle(Ch.INSTANCE_DELETE, (_, payload) =>
      taskModule.deleteTaskInstance.execute(payload?.id ?? payload),
    );
    ipcMain.handle(Ch.INSTANCE_COMPLETE, (_, payload) =>
      taskModule.completeTaskInstance.execute(payload?.id ?? payload, payload?.request),
    );
    ipcMain.handle(Ch.INSTANCE_SKIP, (_, payload) =>
      taskModule.skipTaskInstance.execute(payload?.id ?? payload, payload?.request),
    );
    ipcMain.handle(Ch.INSTANCE_CHECK_EXPIRED, (_, payload) =>
      taskModule.checkExpiredInstances.execute(payload?.identityId ?? ''),
    );

    logger.info('Task module registered');
  },

  destroy(): void {
    for (const ch of channels) {
      ipcMain.removeHandler(ch);
    }
    TaskContainer.getInstance().reset();
    logger.info('Task module destroyed');
  },
};
