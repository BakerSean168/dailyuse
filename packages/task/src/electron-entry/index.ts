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
import { createTaskModule } from '../infrastructure-server/task.module';
import { createTaskTransportHandlers } from '../api/transport-handlers';
import { createTaskRuntimeContribution } from '../api/runtime';
import { createTaskScheduleRuntimeContribution } from '../api/schedule-runtime';
import { TaskTemplateController } from '../api/controllers/task-template.controller';
import { TaskInstanceController } from '../api/controllers/task-instance.controller';
import { TaskDependencyController } from '../api/controllers/task-dependency.controller';
import { createLogger } from '@dailyuse/utils';
import type { TaskModuleInstance } from '../infrastructure-server';
import type { ITaskTemplateRepository } from '../domain-server/repositories/ITaskTemplateRepository';
import type { ITaskInstanceRepository } from '../domain-server/repositories/ITaskInstanceRepository';
import { withAuthenticatedValue } from './authenticated-ipc';
import {
  PowerSyncTaskTemplateRepository,
  PowerSyncTaskInstanceRepository,
  PowerSyncTaskDependencyRepository,
  PowerSyncTaskFolderRepository,
} from '../infrastructure-server/powersync';
import { PowerSyncScheduleTaskRepository } from '@dailyuse/schedule/infrastructure-server';

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
  DEPENDENCY_CREATE: 'task:dependency:create',
  DEPENDENCY_LIST: 'task:dependency:list',
  DEPENDENCY_DEPENDENTS: 'task:dependency:dependents',
  DEPENDENCY_CHAIN: 'task:dependency:chain',
  DEPENDENCY_VALIDATE: 'task:dependency:validate',
  DEPENDENCY_DELETE: 'task:dependency:delete',
  DEPENDENCY_UPDATE: 'task:dependency:update',
} as const;

const channels = Object.values(Ch);
let activeTaskModule: TaskModuleInstance | null = null;
let taskTemplateRepository: ITaskTemplateRepository | null = null;
let taskInstanceRepository: ITaskInstanceRepository | null = null;

export function getTaskTemplateRepository(): ITaskTemplateRepository {
  if (!taskTemplateRepository) {
    throw new Error('Task module not registered yet');
  }

  return taskTemplateRepository;
}

export function getTaskInstanceRepository(): ITaskInstanceRepository {
  if (!taskInstanceRepository) {
    throw new Error('Task module not registered yet');
  }

  return taskInstanceRepository;
}

function normalizeTemplateListParams(
  requestContext: { identityId: string },
  params: Record<string, unknown> | undefined,
): Record<string, unknown> {
  const status = params?.status;

  return {
    ...(params ?? {}),
    identityId: requestContext.identityId,
    status: Array.isArray(status) ? status : typeof status === 'string' ? [status] : undefined,
  };
}

export const TaskElectronModule: IElectronModule = {
  name: 'Task',

  register(ctx: IElectronModuleContext): void {
    const { db } = ctx;

    // 1. Composition Root — PowerSync factory wires repos + use cases + runtime contribution
    //    组合根 — PowerSync 工厂组装仓储、用例和运行时贡献
    const taskTemplateRepo = new PowerSyncTaskTemplateRepository(db as any);
    const taskInstanceRepo = new PowerSyncTaskInstanceRepository(db as any);
    const taskModule = createTaskModule({
      taskTemplateRepository: taskTemplateRepo,
      taskInstanceRepository: taskInstanceRepo,
      taskDependencyRepository: new PowerSyncTaskDependencyRepository(db as any),
      taskFolderRepository: new PowerSyncTaskFolderRepository(db as any),
      runtimeContributions: [
        createTaskRuntimeContribution(),
        createTaskScheduleRuntimeContribution({
          taskTemplateRepository: taskTemplateRepo,
          taskInstanceRepository: taskInstanceRepo,
          scheduleTaskRepository: new PowerSyncScheduleTaskRepository(db as any),
        }),
      ],
    });
    activeTaskModule = taskModule;
    taskTemplateRepository = taskModule.taskTemplateRepository;
    taskInstanceRepository = taskModule.taskInstanceRepository;
    taskModule.start();

    // 2. Transport handlers — map flat API to controller-specific interfaces
    //    传输层处理器 — 将扁平 API 映射到控制器专用接口
    const handlers = createTaskTransportHandlers(taskModule.api);
    const templateController = new TaskTemplateController(handlers.template);
    const instanceController = new TaskInstanceController(handlers.instance);
    const dependencyController = new TaskDependencyController(handlers.dependency);

    // 3. IPC Handlers — delegate to use cases via transport handlers
    //    IPC 处理器 — 通过传输层处理器委托给用例

    // --- Template channels ---
    ipcMain.handle(Ch.TEMPLATE_LIST, (_, params) =>
      withAuthenticatedValue(ctx, async (requestContext) =>
        templateController.listTemplates(
          normalizeTemplateListParams(
            requestContext,
            params && typeof params === 'object' ? (params as Record<string, unknown>) : undefined,
          ) as any,
          requestContext,
        ),
      ),
    );
    ipcMain.handle(Ch.TEMPLATE_GET, (_, payload) =>
      templateController.getTemplate(
        payload?.id ?? payload,
        payload?.includeChildren ?? false,
      ),
    );
    ipcMain.handle(Ch.TEMPLATE_CREATE, (_, dto) =>
      withAuthenticatedValue(ctx, async (requestContext) => {
        return templateController.createTemplate(dto, requestContext);
      }),
    );
    ipcMain.handle(Ch.TEMPLATE_UPDATE, (_, payload) =>
      withAuthenticatedValue(ctx, async () =>
        templateController.updateTemplate(payload?.id, payload?.request),
      ),
    );
    ipcMain.handle(Ch.TEMPLATE_DELETE, (_, payload) =>
      withAuthenticatedValue(ctx, async () =>
        templateController.deleteTemplate(payload?.id ?? payload),
      ),
    );
    ipcMain.handle(Ch.TEMPLATE_ARCHIVE, (_, payload) =>
      withAuthenticatedValue(ctx, async () =>
        templateController.archiveTemplate(payload?.id ?? payload),
      ),
    );
    ipcMain.handle(Ch.TEMPLATE_RESTORE, (_, payload) =>
      withAuthenticatedValue(ctx, async () => {
        return templateController.activateTemplate(payload?.id ?? payload);
      }),
    );
    ipcMain.handle(Ch.TEMPLATE_PAUSE, (_, payload) =>
      withAuthenticatedValue(ctx, async () => {
        return templateController.pauseTemplate(payload?.id ?? payload);
      }),
    );
    ipcMain.handle(Ch.TEMPLATE_GENERATE_INSTANCES, (_, payload) =>
      withAuthenticatedValue(ctx, async () =>
        templateController.generateInstances(payload?.templateId, payload?.request),
      ),
    );
    ipcMain.handle(Ch.TEMPLATE_GET_INSTANCES, (_, payload) =>
      withAuthenticatedValue(ctx, async () => {
        const result = await handlers.template.listInstancesByTemplate.execute(payload?.templateId);
        if (!result.ok) {
          return result;
        }

        if (typeof payload?.from !== 'number' || typeof payload?.to !== 'number') {
          return result.data;
        }

        return result.data.filter(
          (instance) =>
            instance.instanceDate >= payload.from && instance.instanceDate <= payload.to,
        );
      }),
    );
    ipcMain.handle(Ch.TEMPLATE_GET_BY_PRIORITY, (_, payload) =>
      withAuthenticatedValue(ctx, async (requestContext) =>
        templateController.listByPriority(requestContext, payload?.params?.limit),
      ),
    );
    ipcMain.handle(Ch.TEMPLATE_BIND_GOAL, (_, payload) =>
      withAuthenticatedValue(ctx, async () =>
        templateController.bindToGoal(payload?.templateId, payload?.request),
      ),
    );
    ipcMain.handle(Ch.TEMPLATE_UNBIND_GOAL, (_, payload) =>
      withAuthenticatedValue(ctx, async () =>
        templateController.unbindFromGoal(payload?.templateId),
      ),
    );

    // --- Instance channels ---
    ipcMain.handle(Ch.INSTANCE_LIST, (_, params) =>
      withAuthenticatedValue(ctx, async (requestContext) => {
        if (typeof params?.startDate === 'number' && typeof params?.endDate === 'number') {
          const result = await handlers.instance.getByDateRange.execute(
            requestContext.identityId,
            params.startDate,
            params.endDate,
          );
          return result.ok ? result.data.data : result;
        }

        if (params?.templateId) {
          return handlers.instance.listByTemplate.execute(params.templateId);
        }

        if (params?.status) {
          return handlers.instance.listByStatus.execute(requestContext.identityId, params.status);
        }

        return handlers.instance.listByAccount.execute(requestContext.identityId);
      }),
    );
    ipcMain.handle(Ch.INSTANCE_GET, (_, payload) =>
      instanceController.getInstance(payload?.id ?? payload),
    );
    ipcMain.handle(Ch.INSTANCE_CREATE, (_, payload) =>
      withAuthenticatedValue(ctx, async () =>
        instanceController.startInstance(payload?.id ?? payload),
      ),
    );
    ipcMain.handle(Ch.INSTANCE_UPDATE, () => {
      throw new Error('task:instance:update is not supported');
    });
    ipcMain.handle(Ch.INSTANCE_DELETE, (_, payload) =>
      withAuthenticatedValue(ctx, async () =>
        instanceController.deleteInstance(payload?.id ?? payload),
      ),
    );
    ipcMain.handle(Ch.INSTANCE_COMPLETE, (_, payload) =>
      withAuthenticatedValue(ctx, async () =>
        instanceController.completeInstance(payload?.id ?? payload, payload?.request ?? {}),
      ),
    );
    ipcMain.handle(Ch.INSTANCE_SKIP, (_, payload) =>
      withAuthenticatedValue(ctx, async () =>
        instanceController.skipInstance(payload?.id ?? payload, payload?.request ?? {}),
      ),
    );
    ipcMain.handle(Ch.INSTANCE_CHECK_EXPIRED, () =>
      withAuthenticatedValue(ctx, async (requestContext) => {
        const result = await instanceController.checkExpired(requestContext.identityId);
        return result.ok ? { count: result.data.length, instances: result.data } : result;
      }),
    );

    // --- Dependency channels ---
    ipcMain.handle(Ch.DEPENDENCY_CREATE, (_, payload) =>
      withAuthenticatedValue(ctx, async (requestContext) =>
        dependencyController.createDependency(
          payload?.taskId,
          payload?.request,
          requestContext.identityId,
        ),
      ),
    );
    ipcMain.handle(Ch.DEPENDENCY_LIST, (_, payload) =>
      withAuthenticatedValue(ctx, async () =>
        dependencyController.getDependencies(payload?.taskId),
      ),
    );
    ipcMain.handle(Ch.DEPENDENCY_DEPENDENTS, (_, payload) =>
      withAuthenticatedValue(ctx, async () =>
        dependencyController.getDependents(payload?.taskId),
      ),
    );
    ipcMain.handle(Ch.DEPENDENCY_CHAIN, (_, payload) =>
      withAuthenticatedValue(ctx, async () =>
        dependencyController.getDependencyChain(payload?.taskId),
      ),
    );
    ipcMain.handle(Ch.DEPENDENCY_VALIDATE, (_, payload) =>
      withAuthenticatedValue(ctx, async () =>
        dependencyController.validateDependency({
          predecessorTaskId: payload?.predecessorTaskId,
          successorTaskId: payload?.successorTaskId,
        }),
      ),
    );
    ipcMain.handle(Ch.DEPENDENCY_DELETE, (_, payload) =>
      withAuthenticatedValue(ctx, async () =>
        dependencyController.deleteDependency(payload?.id ?? payload),
      ),
    );
    ipcMain.handle(Ch.DEPENDENCY_UPDATE, (_, payload) =>
      withAuthenticatedValue(ctx, async () =>
        dependencyController.updateDependency(payload?.id, payload?.request),
      ),
    );

    logger.info('Task module registered');
  },

  destroy(): void {
    for (const ch of channels) {
      ipcMain.removeHandler(ch);
    }
    activeTaskModule?.dispose();
    activeTaskModule = null;
    taskTemplateRepository = null;
    taskInstanceRepository = null;
    logger.info('Task module destroyed');
  },
};
