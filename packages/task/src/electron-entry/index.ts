/**
 * Task Module — Electron Entry Point.
 * 任务模块 — Electron 入口点。
 *
 * Self-contained task runtime assembly for Electron main process.
 * 任务模块在 Electron 主进程中的自包含运行时组装。
 * Instantiates PowerSync repositories through the module factory,
 * and registers IPC handlers using transport handlers.
 * 通过模块工厂实例化 PowerSync 仓储，并使用传输层处理器注册 IPC 处理器。
 *
 * @module task/electron-entry
 */

import { ipcMain } from 'electron';
import type { IElectronModule, IElectronModuleContext } from '@dailyuse/contracts/electron';
import { createTaskPowerSyncModule } from '../infrastructure-server/powersync';
import { createTaskTransportHandlers } from '../api/transport-handlers';
import { createTaskRuntimeContribution } from '../api/runtime';
import { createLogger } from '@dailyuse/utils';
import type { TaskModuleInstance } from '../infrastructure-server';

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
let activeTaskModule: TaskModuleInstance | null = null;

export const TaskElectronModule: IElectronModule = {
  name: 'Task',

  register(ctx: IElectronModuleContext): void {
    const { db } = ctx;

    // 1. Composition Root — PowerSync factory wires repos + use cases + runtime contribution
    //    组合根 — PowerSync 工厂组装仓储、用例和运行时贡献
    const runtimeContribution = createTaskRuntimeContribution();
    const taskModule = createTaskPowerSyncModule(db as any, runtimeContribution);
    activeTaskModule = taskModule;
    taskModule.start();

    // 2. Transport handlers — map flat API to controller-specific interfaces
    //    传输层处理器 — 将扁平 API 映射到控制器专用接口
    const handlers = createTaskTransportHandlers(taskModule.api);

    // 3. IPC Handlers — delegate to use cases via transport handlers
    //    IPC 处理器 — 通过传输层处理器委托给用例

    // --- Template channels ---
    ipcMain.handle(Ch.TEMPLATE_LIST, (_, params) =>
      handlers.template.listTemplates.execute(params),
    );
    ipcMain.handle(Ch.TEMPLATE_GET, (_, payload) =>
      handlers.template.getTemplate.execute(
        payload?.id ?? payload,
        payload?.includeChildren ?? false,
      ),
    );
    ipcMain.handle(Ch.TEMPLATE_CREATE, (_, dto) => handlers.template.createTemplate.execute(dto));
    ipcMain.handle(Ch.TEMPLATE_UPDATE, (_, payload) =>
      handlers.template.updateTemplate.execute(payload?.id, payload),
    );
    ipcMain.handle(Ch.TEMPLATE_DELETE, (_, payload) =>
      handlers.template.deleteTemplate.execute(payload?.id ?? payload),
    );
    ipcMain.handle(Ch.TEMPLATE_ARCHIVE, (_, payload) =>
      handlers.template.archiveTemplate.execute(payload?.id ?? payload),
    );
    ipcMain.handle(Ch.TEMPLATE_RESTORE, (_, payload) =>
      handlers.template.activateTemplate.execute(payload?.id ?? payload),
    );
    ipcMain.handle(Ch.TEMPLATE_PAUSE, (_, payload) =>
      handlers.template.pauseTemplate.execute(payload?.id ?? payload),
    );
    ipcMain.handle(Ch.TEMPLATE_GENERATE_INSTANCES, (_, payload) =>
      handlers.template.generateInstances.execute(payload?.templateId, payload?.request),
    );
    ipcMain.handle(Ch.TEMPLATE_GET_INSTANCES, (_, payload) =>
      handlers.template.listInstancesByTemplate.execute(payload?.templateId),
    );
    ipcMain.handle(Ch.TEMPLATE_GET_BY_PRIORITY, (_, payload) =>
      handlers.template.listByPriority.execute(payload?.identityId ?? '', payload?.params?.limit),
    );
    ipcMain.handle(Ch.TEMPLATE_BIND_GOAL, (_, payload) =>
      handlers.template.bindToGoal.execute(payload?.templateId, payload?.request),
    );
    ipcMain.handle(Ch.TEMPLATE_UNBIND_GOAL, (_, payload) =>
      handlers.template.unbindFromGoal.execute(payload?.templateId),
    );

    // --- Instance channels ---
    ipcMain.handle(Ch.INSTANCE_LIST, (_, params) =>
      handlers.instance.listByAccount.execute(params),
    );
    ipcMain.handle(Ch.INSTANCE_GET, (_, payload) =>
      handlers.instance.getTaskInstance.execute(payload?.id ?? payload),
    );
    ipcMain.handle(Ch.INSTANCE_CREATE, (_, payload) =>
      handlers.instance.start.execute(payload?.id ?? payload),
    );
    ipcMain.handle(Ch.INSTANCE_UPDATE, () => {
      throw new Error('task:instance:update is not supported');
    });
    ipcMain.handle(Ch.INSTANCE_DELETE, (_, payload) =>
      handlers.instance.deleteInstance.execute(payload?.id ?? payload),
    );
    ipcMain.handle(Ch.INSTANCE_COMPLETE, (_, payload) =>
      handlers.instance.complete.execute(payload?.id ?? payload, payload?.request),
    );
    ipcMain.handle(Ch.INSTANCE_SKIP, (_, payload) =>
      handlers.instance.skip.execute(payload?.id ?? payload, payload?.request),
    );
    ipcMain.handle(Ch.INSTANCE_CHECK_EXPIRED, (_, payload) =>
      handlers.instance.checkExpired.execute(payload?.identityId ?? ''),
    );

    logger.info('Task module registered');
  },

  destroy(): void {
    for (const ch of channels) {
      ipcMain.removeHandler(ch);
    }
    activeTaskModule?.dispose();
    activeTaskModule = null;
    logger.info('Task module destroyed');
  },
};
