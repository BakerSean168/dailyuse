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
 * @module task/electron
 */

import { ipcMain } from 'electron';
import { ok } from '@dailyuse/contracts/result';
import {
  TaskChannels,
  type IElectronDatabase,
  type IElectronModule,
  type IElectronModuleContext,
} from '@dailyuse/contracts/electron';
import type { ListTaskTemplateFilters } from '@dailyuse/contracts/task';
import {
  createTaskPowerSyncModule,
  type TaskModuleInstance,
  type TaskModuleRuntimeContribution,
} from '../server/infrastructure';
import { createTaskTransportHandlers } from '../server/transport';
import { createTaskRuntimeContribution } from '../server/infrastructure/runtime';
import { TaskTemplateController } from '../server/transport/task-template.controller';
import { TaskInstanceController } from '../server/transport/task-instance.controller';
import { TaskDependencyController } from '../server/transport/task-dependency.controller';
import { createLogger } from '@dailyuse/utils/logger';
import type { ITaskTemplateRepository } from '../server/domain/repositories/i-task-template-repository';
import type { ITaskInstanceRepository } from '../server/domain/repositories/i-task-instance-repository';
import { withAuthenticatedValue } from './authenticated-ipc';

const logger = createLogger('TaskElectron');


const allChannels = Object.values(TaskChannels);
let activeTaskModule: TaskModuleInstance | null = null;
let taskTemplateRepository: ITaskTemplateRepository | null = null;
let taskInstanceRepository: ITaskInstanceRepository | null = null;

function isRuntimeContributionArray(
  runtimeContributions:
    | TaskModuleRuntimeContribution
    | readonly TaskModuleRuntimeContribution[],
): runtimeContributions is readonly TaskModuleRuntimeContribution[] {
  return Array.isArray(runtimeContributions);
}

export interface CreateTaskElectronModuleOptions {
  readonly runtimeContributions?:
    | TaskModuleRuntimeContribution
    | readonly TaskModuleRuntimeContribution[];
}

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
): ListTaskTemplateFilters {
  const status = params?.status;

  return {
    ...(params ?? {}),
    status: Array.isArray(status) ? status : typeof status === 'string' ? [status] : undefined,
  };
}

function normalizeRuntimeContributions(
  runtimeContributions?:
    | TaskModuleRuntimeContribution
    | readonly TaskModuleRuntimeContribution[],
): readonly TaskModuleRuntimeContribution[] {
  if (!runtimeContributions) {
    return [];
  }

  if (isRuntimeContributionArray(runtimeContributions)) {
    return Array.from(runtimeContributions);
  }

  return [runtimeContributions];
}

export function createTaskElectronModule(
  options: CreateTaskElectronModuleOptions = {},
): IElectronModule {
  return {
    name: 'Task',

    register(ctx: IElectronModuleContext): void {
      const { db: electronDb } = ctx;
      const db: IElectronDatabase = electronDb;

      const taskModule = createTaskPowerSyncModule(db, [
        createTaskRuntimeContribution(),
        ...normalizeRuntimeContributions(options.runtimeContributions),
      ]);
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
      ipcMain.handle(TaskChannels.TEMPLATE_LIST, (_, params) =>
        withAuthenticatedValue(ctx, async (requestContext) =>
          templateController.listTemplates(
            normalizeTemplateListParams(
              requestContext,
              params && typeof params === 'object' ? (params as Record<string, unknown>) : undefined,
            ),
            requestContext,
          ),
        ),
      );
      ipcMain.handle(TaskChannels.TEMPLATE_GET, (_, payload) =>
        withAuthenticatedValue(ctx, async (requestContext) =>
          templateController.getTemplate(
            payload?.id ?? payload,
            requestContext,
            payload?.includeChildren ?? false,
          ),
        ),
      );
      ipcMain.handle(TaskChannels.TEMPLATE_GRAPH, (_, params) =>
        withAuthenticatedValue(ctx, async (requestContext) =>
          templateController.getTaskGraph(
            normalizeTemplateListParams(
              requestContext,
              params && typeof params === 'object' ? (params as Record<string, unknown>) : undefined,
            ),
            requestContext,
          ),
        ),
      );
      ipcMain.handle(TaskChannels.TEMPLATE_CREATE, (_, dto) =>
        withAuthenticatedValue(ctx, async (requestContext) => {
          return templateController.createTemplate(dto, requestContext);
        }),
      );
      ipcMain.handle(TaskChannels.TEMPLATE_UPDATE, (_, payload) =>
        withAuthenticatedValue(ctx, async (requestContext) =>
          templateController.updateTemplate(payload?.id, payload?.request, requestContext),
        ),
      );
      ipcMain.handle(TaskChannels.TEMPLATE_DELETE, (_, payload) =>
        withAuthenticatedValue(ctx, async (requestContext) => {
          const result = await templateController.deleteTemplate(
            payload?.id ?? payload,
            requestContext,
          );
          if (!result.ok) return result;
          return ok(null);
        }),
      );
      ipcMain.handle(TaskChannels.TEMPLATE_ARCHIVE, (_, payload) =>
        withAuthenticatedValue(ctx, async (requestContext) =>
          templateController.archiveTemplate(payload?.id ?? payload, requestContext),
        ),
      );
      ipcMain.handle(TaskChannels.TEMPLATE_RESTORE, (_, payload) =>
        withAuthenticatedValue(ctx, async (requestContext) => {
          return templateController.activateTemplate(payload?.id ?? payload, requestContext);
        }),
      );
      ipcMain.handle(TaskChannels.TEMPLATE_PAUSE, (_, payload) =>
        withAuthenticatedValue(ctx, async (requestContext) => {
          return templateController.pauseTemplate(payload?.id ?? payload, requestContext);
        }),
      );
      ipcMain.handle(TaskChannels.TEMPLATE_GENERATE_INSTANCES, (_, payload) =>
        withAuthenticatedValue(ctx, async (requestContext) =>
          templateController.generateInstances(
            payload?.templateId,
            payload?.request,
            requestContext,
          ),
        ),
      );
      ipcMain.handle(TaskChannels.TEMPLATE_GET_INSTANCES, (_, payload) =>
        withAuthenticatedValue(ctx, async (requestContext) => {
          return templateController.getInstancesByTemplate(
            payload?.templateId,
            requestContext,
            {
              from: payload?.from,
              to: payload?.to,
            },
          );
        }),
      );
      ipcMain.handle(TaskChannels.TEMPLATE_GET_BY_PRIORITY, (_, payload) =>
        withAuthenticatedValue(ctx, async (requestContext) =>
          templateController.listByPriority(requestContext, payload?.params?.limit),
        ),
      );
      ipcMain.handle(TaskChannels.TEMPLATE_BIND_GOAL, (_, payload) =>
        withAuthenticatedValue(ctx, async (requestContext) =>
          templateController.bindToGoal(
            payload?.templateId,
            payload?.request,
            requestContext,
          ),
        ),
      );
      ipcMain.handle(TaskChannels.TEMPLATE_UNBIND_GOAL, (_, payload) =>
        withAuthenticatedValue(ctx, async (requestContext) =>
          templateController.unbindFromGoal(payload?.templateId, requestContext),
        ),
      );

      // --- Instance channels ---
      ipcMain.handle(TaskChannels.INSTANCE_LIST, (_, params) =>
        withAuthenticatedValue(ctx, async (requestContext) => {
          if (params?.templateId) {
            return handlers.instance.listByTemplate(params.templateId, requestContext.identityId);
          }

          if (params?.status) {
            return handlers.instance.listByStatus(requestContext.identityId, params.status);
          }

          return handlers.instance.listByAccount(requestContext.identityId);
        }),
      );
      ipcMain.handle(TaskChannels.INSTANCE_LIST_BY_DATE_RANGE, (_, params) =>
        withAuthenticatedValue(ctx, async (requestContext) => {
          return instanceController.getInstancesByDateRange(requestContext.identityId, {
            startDate: params?.startDate ?? Date.now(),
            endDate: params?.endDate ?? Date.now() + 86400000 * 7,
          });
        }),
      );
      ipcMain.handle(TaskChannels.INSTANCE_GET, (_, payload) =>
        withAuthenticatedValue(ctx, async (requestContext) =>
          instanceController.getInstance(payload?.id ?? payload, requestContext),
        ),
      );
      ipcMain.handle(TaskChannels.INSTANCE_CREATE, (_, payload) =>
        withAuthenticatedValue(ctx, async (requestContext) =>
          instanceController.startInstance(payload?.id ?? payload, requestContext),
        ),
      );
      ipcMain.handle(TaskChannels.INSTANCE_DELETE, (_, payload) =>
        withAuthenticatedValue(ctx, async (requestContext) => {
          const result = await instanceController.deleteInstance(
            payload?.id ?? payload,
            requestContext,
          );
          if (!result.ok) return result;
          return ok(null);
        }),
      );
      ipcMain.handle(TaskChannels.INSTANCE_COMPLETE, (_, payload) =>
        withAuthenticatedValue(ctx, async (requestContext) =>
          instanceController.completeInstance(
            payload?.id ?? payload,
            payload?.request,
            requestContext,
          ),
        ),
      );
      ipcMain.handle(TaskChannels.INSTANCE_SKIP, (_, payload) =>
        withAuthenticatedValue(ctx, async (requestContext) =>
          instanceController.skipInstance(
            payload?.id ?? payload,
            payload?.request,
            requestContext,
          ),
        ),
      );
      ipcMain.handle(TaskChannels.INSTANCE_CHECK_EXPIRED, () =>
        withAuthenticatedValue(ctx, async (requestContext) =>
          instanceController.checkExpired(requestContext.identityId),
        ),
      );

      // --- Dependency channels ---
      ipcMain.handle(TaskChannels.DEPENDENCY_CREATE, (_, payload) =>
        withAuthenticatedValue(ctx, async (requestContext) =>
          dependencyController.createDependency(
            payload?.taskId,
            payload?.request,
            requestContext.identityId,
          ),
        ),
      );
      ipcMain.handle(TaskChannels.DEPENDENCY_LIST, (_, payload) =>
        withAuthenticatedValue(ctx, async () =>
          dependencyController.getDependencies(payload?.taskId),
        ),
      );
      ipcMain.handle(TaskChannels.DEPENDENCY_DEPENDENTS, (_, payload) =>
        withAuthenticatedValue(ctx, async () =>
          dependencyController.getDependents(payload?.taskId),
        ),
      );
      ipcMain.handle(TaskChannels.DEPENDENCY_CHAIN, (_, payload) =>
        withAuthenticatedValue(ctx, async () =>
          dependencyController.getDependencyChain(payload?.taskId),
        ),
      );
      ipcMain.handle(TaskChannels.DEPENDENCY_VALIDATE, (_, payload) =>
        withAuthenticatedValue(ctx, async () =>
          dependencyController.validateDependency({
            predecessorTaskId: payload?.predecessorTaskId,
            successorTaskId: payload?.successorTaskId,
          }),
        ),
      );
      ipcMain.handle(TaskChannels.DEPENDENCY_DELETE, (_, payload) =>
        withAuthenticatedValue(ctx, async () => {
          const result = await dependencyController.deleteDependency(payload?.id ?? payload);
          if (!result.ok) return result;
          return ok(null);
        }),
      );
      ipcMain.handle(TaskChannels.DEPENDENCY_UPDATE, (_, payload) =>
        withAuthenticatedValue(ctx, async () =>
          dependencyController.updateDependency(payload?.id, payload?.request),
        ),
      );

      logger.info('Task module registered');
    },

    destroy(): void {
      for (const ch of allChannels) {
        ipcMain.removeHandler(ch);
      }
      activeTaskModule?.dispose();
      activeTaskModule = null;
      taskTemplateRepository = null;
      taskInstanceRepository = null;
      logger.info('Task module destroyed');
    },
  };
}

export const TaskElectronModule: IElectronModule = createTaskElectronModule();
export {
  createTaskPowerSyncScheduleExecutionSource,
  createTaskPowerSyncScheduleProjectionSource,
} from '../server/infrastructure';


