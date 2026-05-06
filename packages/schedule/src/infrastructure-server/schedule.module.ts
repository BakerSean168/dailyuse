/**
 * createScheduleModule — explicit composition root for the schedule server runtime.
 * createScheduleModule —— 调度模块服务端运行时的显式组合根。
 *
 * The outer app selects concrete adapters and passes them in here.
 * This module then assembles the application layer exactly once and exposes a
 * stable facade to HTTP / IPC transports.
 *
 * 外层应用负责选择具体适配器并传入这里。
 * 组合根只做一次组装，然后向 HTTP / IPC 等传输层暴露稳定门面。
 *
 * Schedule uses the governance module as the canonical reference for
 * the target monorepo pattern: one composition root per module, constructor
 * injection only, no hidden service locator.
 */

import type {
  IScheduleRepository,
  IScheduleExecutionRepository,
  IScheduleTaskRepository,
} from '../domain-server';
import {
  BatchDeleteScheduleTasksUseCase,
  BatchOperateScheduleTasksUseCase,
  CancelScheduleTaskUseCase,
  CompleteScheduleTaskUseCase,
  CreateScheduleTaskUseCase,
  DeleteScheduleTaskUseCase,
  GetDueScheduleTasksUseCase,
  ListScheduleTasksBySourceUseCase,
  PauseScheduleTaskUseCase,
  ResumeScheduleTaskUseCase,
  GetScheduleTaskUseCase,
  ListScheduleTasksByAccountUseCase,
  ListScheduleTasksByStatusUseCase,
  TriggerScheduleTaskUseCase,
  UpdateScheduleTaskUseCase,
  UpdateScheduleTaskMetadataUseCase,
} from '../application-server/use-cases';
import { ScheduleEventApplicationService } from '../application-server/services/schedule-event-application-service';
import { ScheduleConflictDetectionService } from '../application-server/services/schedule-conflict-detection-service';
import { ScheduleConflictResolutionService } from '../application-server/services/schedule-conflict-resolution-service';
import type { Result } from '@dailyuse/contracts/result';
import { toResultErrorException } from '@dailyuse/contracts/result';
import type { BatchScheduleTaskOperationRequest } from '@dailyuse/contracts/schedule';
import type { Context } from '@dailyuse/contracts/shared';
import type {
  CreateScheduleRequest,
  DetectConflictsInternalQuery,
  GetSchedulesByTimeRangeInternalQuery,
  ResolveConflictRequest,
  CreateScheduleTaskRequest,
  UpdateScheduleRequest,
  UpdateScheduleTaskRequest,
  UpdateTaskMetadataRequest,
} from '@dailyuse/contracts/schedule';
import { resultify } from '@dailyuse/utils/result';

/**
 * Everything the schedule server runtime needs from the outside world.
 * 调度模块服务端运行时向外部索取的全部依赖。
 *
 * Refactor rule for other modules:
 * - only put ports or runtime contributions here
 * - never put transport objects (Express req/res, ipcMain, Router) here
 * - never hide these dependencies behind a singleton container
 */
export type ScheduleRuntimeContributionsInput =
  | ScheduleModuleRuntimeContribution
  | readonly ScheduleModuleRuntimeContribution[];

export interface ScheduleModuleDependencies {
  readonly scheduleRepository: IScheduleRepository;
  readonly scheduleExecutionRepository: IScheduleExecutionRepository;
  readonly scheduleTaskRepository: IScheduleTaskRepository;
  readonly runtimeContributions?: ScheduleRuntimeContributionsInput;
}

/**
 * Module-owned runtime side effects.
 * 模块拥有的运行时副作用。
 *
 * A contribution is the unit we start/stop together with the module instance.
 * This replaces the old global initialization pattern with explicit module-owned runtime hooks.
 */
export interface ScheduleModuleRuntimeContribution {
  start(): void;
  stop(): void;
}

/**
 * Lower-level assembled use cases.
 * 已完成接线的底层 use case 集合。
 *
 * We keep this type because tests and low-level assembly sometimes need direct
 * access to use-case objects, but transports should prefer `ScheduleApplicationPort`.
 */
export interface ScheduleModuleUseCases {
  readonly createScheduleTask: CreateScheduleTaskUseCase;
  readonly updateScheduleTask: UpdateScheduleTaskUseCase;
  readonly deleteScheduleTask: DeleteScheduleTaskUseCase;
  readonly pauseScheduleTask: PauseScheduleTaskUseCase;
  readonly resumeScheduleTask: ResumeScheduleTaskUseCase;
  readonly triggerScheduleTask: TriggerScheduleTaskUseCase;
  readonly completeScheduleTask: CompleteScheduleTaskUseCase;
  readonly cancelScheduleTask: CancelScheduleTaskUseCase;
  readonly getScheduleTask: GetScheduleTaskUseCase;
  readonly getDueScheduleTasks: GetDueScheduleTasksUseCase;
  readonly listScheduleTasksByAccount: ListScheduleTasksByAccountUseCase;
  readonly listScheduleTasksBySource: ListScheduleTasksBySourceUseCase;
  readonly listScheduleTasksByStatus: ListScheduleTasksByStatusUseCase;
  readonly batchDeleteScheduleTasks: BatchDeleteScheduleTasksUseCase;
  readonly batchOperateScheduleTasks: BatchOperateScheduleTasksUseCase;
  readonly updateScheduleTaskMetadata: UpdateScheduleTaskMetadataUseCase;
  readonly scheduleEventService: ScheduleEventApplicationService;
  readonly conflictDetectionService: ScheduleConflictDetectionService;
  readonly conflictResolutionService: ScheduleConflictResolutionService;
}

/** Transport-neutral callable application surface. 传输层无关的可调用应用层门面。 */
export interface ScheduleApplicationPort {
  createTask(data: CreateScheduleTaskRequest, ctx: Context): Promise<Result<unknown>>;
  listTasks(query: Record<string, unknown>, ctx: Context): Promise<Result<unknown>>;
  getTask(id: string): Promise<Result<unknown>>;
  updateTask(id: string, data: UpdateScheduleTaskRequest): Promise<Result<unknown>>;
  deleteTask(id: string): Promise<Result<unknown>>;
  pauseTask(id: string): Promise<Result<unknown>>;
  resumeTask(id: string): Promise<Result<unknown>>;
  triggerTask(id: string): Promise<Result<unknown>>;
  completeTask(id: string): Promise<Result<unknown>>;
  cancelTask(id: string, reason: string): Promise<Result<unknown>>;
  getDueTasks(ctx: Context): Promise<Result<unknown>>;
  batchOperateTasks(data: BatchScheduleTaskOperationRequest): Promise<Result<unknown>>;
  batchDeleteTasks(ids: string[]): Promise<Result<unknown>>;
  updateTaskMetadata(id: string, metadata: UpdateTaskMetadataRequest): Promise<Result<unknown>>;
}

export interface ScheduleEventApplicationPort {
  createEvent(data: CreateScheduleRequest, ctx: Context): Promise<Result<unknown>>;
  getEvent(id: string): Promise<Result<unknown>>;
  listEvents(query: GetSchedulesByTimeRangeInternalQuery, ctx: Context): Promise<Result<unknown>>;
  updateEvent(id: string, data: UpdateScheduleRequest): Promise<Result<unknown>>;
  deleteEvent(id: string): Promise<Result<unknown>>;
  getConflicts(id: string): Promise<Result<unknown>>;
  detectConflicts(data: DetectConflictsInternalQuery): Promise<Result<unknown>>;
  createEventWithConflictDetection(
    data: CreateScheduleRequest,
    ctx: Context,
  ): Promise<Result<unknown>>;
  resolveConflict(id: string, data: ResolveConflictRequest): Promise<Result<unknown>>;
}

/**
 * Primary schedule composition root return type.
 * 调度模块主组合根返回类型。
 *
 * `api` is the transport-facing surface.
 * `useCases` is kept for low-level tests and diagnostics.
 * `start` / `dispose` own runtime side effects.
 */
export interface ScheduleModuleInstance {
  readonly scheduleRepository: IScheduleRepository;
  readonly scheduleExecutionRepository: IScheduleExecutionRepository;
  readonly scheduleTaskRepository: IScheduleTaskRepository;
  readonly useCases: ScheduleModuleUseCases;
  readonly api: ScheduleApplicationPort;
  readonly eventApi: ScheduleEventApplicationPort;
  start(): void;
  dispose(): void;
}

function toCreateSchedulePayload(data: CreateScheduleRequest, identityId: string) {
  return {
    identityId,
    title: data.name,
    startTime: data.startTime,
    endTime: data.endTime,
    description: data.description,
    location: data.location,
    priority: data.priority,
    attendees: data.attendees,
  };
}

function toUpdateSchedulePayload(data: UpdateScheduleRequest) {
  return {
    title: data.name,
    startTime: data.startTime,
    endTime: data.endTime,
    description: data.description,
    location: data.location,
    priority: data.priority,
    attendees: data.attendees,
  };
}

/**
 * Pure assembly helper used by the class facade and tests.
 * 纯组装函数：给定依赖对象，返回已经接好线的 use case 集合。
 */
export function createScheduleUseCases(
  dependencies: ScheduleModuleDependencies,
): ScheduleModuleUseCases {
  const { scheduleRepository, scheduleExecutionRepository, scheduleTaskRepository } = dependencies;
  const deleteScheduleTask = new DeleteScheduleTaskUseCase(scheduleTaskRepository);
  const pauseScheduleTask = new PauseScheduleTaskUseCase(scheduleTaskRepository);
  const resumeScheduleTask = new ResumeScheduleTaskUseCase(scheduleTaskRepository);
  const cancelScheduleTask = new CancelScheduleTaskUseCase(scheduleTaskRepository);
  const updateScheduleTask = new UpdateScheduleTaskUseCase(scheduleTaskRepository);
  const scheduleEventService = new ScheduleEventApplicationService(scheduleRepository);
  const conflictDetectionService = new ScheduleConflictDetectionService(scheduleRepository);

  return {
    createScheduleTask: new CreateScheduleTaskUseCase(scheduleTaskRepository),
    updateScheduleTask,
    deleteScheduleTask,
    pauseScheduleTask,
    resumeScheduleTask,
    triggerScheduleTask: new TriggerScheduleTaskUseCase(scheduleTaskRepository),
    completeScheduleTask: new CompleteScheduleTaskUseCase(scheduleTaskRepository),
    cancelScheduleTask,
    getScheduleTask: new GetScheduleTaskUseCase(scheduleTaskRepository),
    getDueScheduleTasks: new GetDueScheduleTasksUseCase(scheduleTaskRepository),
    listScheduleTasksByAccount: new ListScheduleTasksByAccountUseCase(scheduleTaskRepository),
    listScheduleTasksBySource: new ListScheduleTasksBySourceUseCase(scheduleTaskRepository),
    listScheduleTasksByStatus: new ListScheduleTasksByStatusUseCase(scheduleTaskRepository),
    batchDeleteScheduleTasks: new BatchDeleteScheduleTasksUseCase(deleteScheduleTask),
    batchOperateScheduleTasks: new BatchOperateScheduleTasksUseCase({
      pauseScheduleTask,
      resumeScheduleTask,
      cancelScheduleTask,
      updateScheduleTask,
    }),
    updateScheduleTaskMetadata: new UpdateScheduleTaskMetadataUseCase(scheduleTaskRepository),
    scheduleEventService,
    conflictDetectionService,
    conflictResolutionService: new ScheduleConflictResolutionService(
      scheduleEventService,
      conflictDetectionService,
    ),
  };
}

function normalizeRuntimeContributions(
  runtimeContributions?:
    | ScheduleModuleRuntimeContribution
    | ReadonlyArray<ScheduleModuleRuntimeContribution>,
): readonly ScheduleModuleRuntimeContribution[] {
  if (!runtimeContributions) {
    return [];
  }

  if (Array.isArray(runtimeContributions)) {
    return Array.from(runtimeContributions);
  }

  return [runtimeContributions as ScheduleModuleRuntimeContribution];
}

/**
 * Canonical composition root.
 * 规范化的调度模块主组合根。
 *
 * This follows the governance module pattern: one composition root per module,
 * constructor injection only, no hidden service locator.
 * The expected reading order is:
 * 1. define `Dependencies`
 * 2. define transport-neutral `ApplicationPort`
 * 3. assemble use cases once
 * 4. wrap them in `api` (ok/fail wrapping lives here, not in transports)
 * 5. let the module instance own `start` / `dispose`
 */
export function createScheduleModule(
  dependencies: ScheduleModuleDependencies,
): ScheduleModuleInstance {
  const { scheduleRepository, scheduleExecutionRepository, scheduleTaskRepository } = dependencies;
  const runtimeContributions = normalizeRuntimeContributions(dependencies.runtimeContributions);
  const useCases = createScheduleUseCases(dependencies);
  let started = false;

  /**
   * ApplicationPort — wraps use cases with ok()/fail() so transports stay boring.
   * ApplicationPort —— 用 ok()/fail() 包裹 use case，让传输层保持简单无聊。
   */
  const api: ScheduleApplicationPort = {
    createTask: async (data, ctx) => {
      return useCases.createScheduleTask.execute({
        name: data.name,
        sourceModule: data.sourceModule,
        sourceId: data.sourceEntityId,
        scheduleConfig: data.schedule as any,
        handlerType: data.sourceModule,
        description: data.description,
        retryPolicy: data.retryPolicy as any,
        enabled: data.enabled,
        identityId: ctx.identityId,
      });
    },
    listTasks: async (query, ctx) => {
      if (query.status) {
        return useCases.listScheduleTasksByStatus.execute(query.status as any);
      } else if (query.sourceModule && query.sourceEntityId) {
        return useCases.listScheduleTasksBySource.execute(
          query.sourceModule as any,
          query.sourceEntityId as string,
        );
      } else {
        return useCases.listScheduleTasksByAccount.execute(ctx.identityId);
      }
    },
    updateTask: async (id, data) => {
      return useCases.updateScheduleTask.execute({
        id,
        scheduleConfig: data.schedule as any,
        retryPolicy: data.retryPolicy as any,
        enabled: data.enabled,
        description: data.description,
      });
    },
    deleteTask: async (id) => useCases.deleteScheduleTask.execute(id),
    pauseTask: async (id) => useCases.pauseScheduleTask.execute(id),
    resumeTask: async (id) => useCases.resumeScheduleTask.execute(id),
    triggerTask: async (id) => useCases.triggerScheduleTask.execute(id),
    getTask: async (id) => useCases.getScheduleTask.execute(id),
    completeTask: async (id) => useCases.completeScheduleTask.execute(id),
    cancelTask: async (id, reason) => useCases.cancelScheduleTask.execute(id, reason),
    getDueTasks: async () => useCases.getDueScheduleTasks.execute(),
    batchOperateTasks: async (data) => useCases.batchOperateScheduleTasks.execute(data),
    batchDeleteTasks: async (ids) => useCases.batchDeleteScheduleTasks.execute(ids),
    updateTaskMetadata: async (id, metadata) => useCases.updateScheduleTaskMetadata.execute(id, metadata),
  };

  const eventApi: ScheduleEventApplicationPort = {
    createEvent: async (data, ctx) =>
      resultify(
        () =>
          useCases.scheduleEventService.createSchedule(toCreateSchedulePayload(data, ctx.identityId)),
        'Failed to create schedule event',
      ),
    getEvent: async (id) =>
      resultify(async () => {
        const event = await useCases.scheduleEventService.getSchedule(id);
        if (!event) {
          throw toResultErrorException({ code: 'NOT_FOUND', message: '日程不存在' }, 404);
        }
        return event;
      }, 'Failed to get schedule event'),
    listEvents: async (query, ctx) =>
      resultify(
        () =>
          useCases.scheduleEventService.getSchedulesByRange(
            query.identityId,
            query.startTime,
            query.endTime,
          ),
        'Failed to list schedule events',
      ),
    updateEvent: async (id, data) =>
      resultify(
        () => useCases.scheduleEventService.updateSchedule(id, toUpdateSchedulePayload(data)),
        'Failed to update schedule event',
      ),
    deleteEvent: async (id) =>
      resultify(async () => {
        await useCases.scheduleEventService.deleteSchedule(id);
        return null;
      }, 'Failed to delete schedule event'),
    getConflicts: async (id) =>
      resultify(() => useCases.conflictResolutionService.getConflicts(id), 'Failed to get schedule conflicts'),
    detectConflicts: async (data) =>
      resultify(() => useCases.conflictResolutionService.detectConflicts(data), 'Failed to detect schedule conflicts'),
    createEventWithConflictDetection: async (data, ctx) =>
      resultify(
        () => useCases.conflictResolutionService.createWithConflictDetection(data, ctx.identityId),
        'Failed to create schedule event with conflict detection',
      ),
    resolveConflict: async (id, data) =>
      resultify(
        () => useCases.conflictResolutionService.resolveConflict(id, data),
        'Failed to resolve schedule conflict',
      ),
  };

  return {
    scheduleRepository,
    scheduleExecutionRepository,
    scheduleTaskRepository,
    useCases,
    api,
    eventApi,
    start(): void {
      if (started) {
        return;
      }

      for (const runtime of runtimeContributions) {
        runtime.start();
      }

      started = true;
    },
    dispose(): void {
      if (!started) {
        return;
      }

      for (const runtime of [...runtimeContributions].reverse()) {
        runtime.stop();
      }

      started = false;
    },
  };
}
