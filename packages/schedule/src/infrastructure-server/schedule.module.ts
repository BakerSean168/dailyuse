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
  CreateScheduleTaskUseCase,
  DeleteScheduleTaskUseCase,
  ListScheduleTasksBySourceUseCase,
  PauseScheduleTaskUseCase,
  ResumeScheduleTaskUseCase,
  GetScheduleTaskUseCase,
  ListScheduleTasksByAccountUseCase,
  ListScheduleTasksByStatusUseCase,
  TriggerScheduleTaskUseCase,
  UpdateScheduleTaskUseCase,
} from '../application-server/use-cases';
import { ScheduleEventApplicationService } from '../application-server/services/schedule-event-application-service';
import { ScheduleConflictDetectionService } from '../application-server/services/schedule-conflict-detection-service';
import type { Result } from '@dailyuse/contracts/result';
import { ok, fail } from '@dailyuse/contracts/result';
import type { Context } from '@dailyuse/contracts/shared';
import type {
  CreateScheduleRequest,
  DetectConflictsInternalQuery,
  GetSchedulesByTimeRangeInternalQuery,
  ResolveConflictRequest,
  CreateScheduleTaskRequest,
  UpdateScheduleRequest,
  UpdateScheduleTaskRequest,
} from '@dailyuse/contracts/schedule';

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
  readonly getScheduleTask: GetScheduleTaskUseCase;
  readonly listScheduleTasksByAccount: ListScheduleTasksByAccountUseCase;
  readonly listScheduleTasksBySource: ListScheduleTasksBySourceUseCase;
  readonly listScheduleTasksByStatus: ListScheduleTasksByStatusUseCase;
  readonly scheduleEventService: ScheduleEventApplicationService;
  readonly conflictDetectionService: ScheduleConflictDetectionService;
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
  batchDeleteTasks(ids: string[]): Promise<Result<unknown>>;
  updateTaskMetadata(id: string, metadata: Record<string, unknown>): Promise<Result<unknown>>;
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

  return {
    createScheduleTask: new CreateScheduleTaskUseCase(scheduleTaskRepository),
    updateScheduleTask: new UpdateScheduleTaskUseCase(scheduleTaskRepository),
    deleteScheduleTask: new DeleteScheduleTaskUseCase(scheduleTaskRepository),
    pauseScheduleTask: new PauseScheduleTaskUseCase(scheduleTaskRepository),
    resumeScheduleTask: new ResumeScheduleTaskUseCase(scheduleTaskRepository),
    triggerScheduleTask: new TriggerScheduleTaskUseCase(scheduleTaskRepository),
    getScheduleTask: new GetScheduleTaskUseCase(scheduleTaskRepository),
    listScheduleTasksByAccount: new ListScheduleTasksByAccountUseCase(scheduleTaskRepository),
    listScheduleTasksBySource: new ListScheduleTasksBySourceUseCase(scheduleTaskRepository),
    listScheduleTasksByStatus: new ListScheduleTasksByStatusUseCase(scheduleTaskRepository),
    scheduleEventService: new ScheduleEventApplicationService(scheduleRepository),
    conflictDetectionService: new ScheduleConflictDetectionService(scheduleRepository),
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
      const result = await useCases.createScheduleTask.execute({
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
      return ok(result);
    },
    listTasks: async (query, ctx) => {
      let tasks;
      if (query.status) {
        tasks = await useCases.listScheduleTasksByStatus.execute(query.status as any);
      } else if (query.sourceModule && query.sourceEntityId) {
        tasks = await useCases.listScheduleTasksBySource.execute(
          query.sourceModule as any,
          query.sourceEntityId as string,
        );
      } else {
        tasks = await useCases.listScheduleTasksByAccount.execute(ctx.identityId);
      }
      return ok(tasks);
    },
    updateTask: async (id, data) => {
      const result = await useCases.updateScheduleTask.execute({
        id,
        scheduleConfig: data.schedule as any,
        retryPolicy: data.retryPolicy as any,
        enabled: data.enabled,
        description: data.description,
      });
      return ok(result);
    },
    deleteTask: async (id) => ok(await useCases.deleteScheduleTask.execute(id)),
    pauseTask: async (id) => ok(await useCases.pauseScheduleTask.execute(id)),
    resumeTask: async (id) => ok(await useCases.resumeScheduleTask.execute(id)),
    triggerTask: async (id) => ok(await useCases.triggerScheduleTask.execute(id)),
    getTask: async (id) => ok(await useCases.getScheduleTask.execute(id)),
    completeTask: async (id) => {
      const task = await scheduleTaskRepository.findById(id as any);
      if (!task) return fail({ code: 'NOT_FOUND', message: '任务不存在' });
      task.complete();
      await scheduleTaskRepository.save(task);
      return ok(task.toServerDTO());
    },
    cancelTask: async (id, reason) => {
      const task = await scheduleTaskRepository.findById(id as any);
      if (!task) return fail({ code: 'NOT_FOUND', message: '任务不存在' });
      task.cancel(reason);
      await scheduleTaskRepository.save(task);
      return ok(task.toServerDTO());
    },
    getDueTasks: async () => {
      const tasks = await scheduleTaskRepository.findDueTasksForExecution(new Date());
      return ok(tasks.map((t: any) => t.toServerDTO()));
    },
    batchDeleteTasks: async (ids) => {
      const results = { success: [] as string[], failed: [] as { id: string; error: string }[] };
      for (const id of ids) {
        try {
          await useCases.deleteScheduleTask.execute(id);
          results.success.push(id);
        } catch (err) {
          results.failed.push({
            id,
            error: err instanceof Error ? err.message : 'Unknown error',
          });
        }
      }
      return ok(results);
    },
    updateTaskMetadata: async (id, metadata) => {
      const task = await scheduleTaskRepository.findById(id as any);
      if (!task) return fail({ code: 'NOT_FOUND', message: '任务不存在' });
      task.updateMetadata(metadata);
      await scheduleTaskRepository.save(task);
      return ok(task.toServerDTO());
    },
  };

  const eventApi: ScheduleEventApplicationPort = {
    createEvent: async (data, ctx) => {
      try {
        const event = await useCases.scheduleEventService.createSchedule(
          toCreateSchedulePayload(data, ctx.identityId),
        );
        return ok(event);
      } catch (err: unknown) {
        return fail({
          code: 'INTERNAL_ERROR',
          message: err instanceof Error ? err.message : 'Unknown error',
        });
      }
    },
    getEvent: async (id) => {
      try {
        const event = await useCases.scheduleEventService.getSchedule(id);
        if (!event) {
          return fail({ code: 'NOT_FOUND', message: '日程不存在' });
        }
        return ok(event);
      } catch (err: unknown) {
        return fail({
          code: 'INTERNAL_ERROR',
          message: err instanceof Error ? err.message : 'Unknown error',
        });
      }
    },
    listEvents: async (query, ctx) => {
      try {
        // Use identityId from the internal query (already injected from ctx by controller)
        const events = await useCases.scheduleEventService.getSchedulesByRange(
          query.identityId,
          query.startTime,
          query.endTime,
        );
        return ok(events);
      } catch (err: unknown) {
        return fail({
          code: 'INTERNAL_ERROR',
          message: err instanceof Error ? err.message : 'Unknown error',
        });
      }
    },
    updateEvent: async (id, data) => {
      try {
        const event = await useCases.scheduleEventService.updateSchedule(
          id,
          toUpdateSchedulePayload(data),
        );
        return ok(event);
      } catch (err: unknown) {
        if (err instanceof Error && err.message.includes('not found')) {
          return fail({ code: 'NOT_FOUND', message: err.message });
        }
        return fail({
          code: 'INTERNAL_ERROR',
          message: err instanceof Error ? err.message : 'Unknown error',
        });
      }
    },
    deleteEvent: async (id) => {
      try {
        await useCases.scheduleEventService.deleteSchedule(id);
        return ok(null);
      } catch (err: unknown) {
        if (err instanceof Error && err.message.includes('not found')) {
          return fail({ code: 'NOT_FOUND', message: err.message });
        }
        return fail({
          code: 'INTERNAL_ERROR',
          message: err instanceof Error ? err.message : 'Unknown error',
        });
      }
    },
    getConflicts: async (id) => {
      try {
        const result = await useCases.conflictDetectionService.getScheduleConflicts(id);
        return ok(result);
      } catch (err: unknown) {
        if (err instanceof Error && err.message.includes('not found')) {
          return fail({ code: 'NOT_FOUND', message: err.message });
        }
        return fail({
          code: 'INTERNAL_ERROR',
          message: err instanceof Error ? err.message : 'Unknown error',
        });
      }
    },
    detectConflicts: async (data) => {
      try {
        const result = await useCases.conflictDetectionService.detectConflictsForTimeRange({
          identityId: data.identityId,
          startTime: data.startTime,
          endTime: data.endTime,
          excludeId: data.excludeId,
        });
        return ok(result);
      } catch (err: unknown) {
        return fail({
          code: 'INTERNAL_ERROR',
          message: err instanceof Error ? err.message : 'Unknown error',
        });
      }
    },
    createEventWithConflictDetection: async (data, ctx) => {
      try {
        const schedule = await useCases.scheduleEventService.createSchedule(
          toCreateSchedulePayload(data, ctx.identityId),
        );
        const conflicts = await useCases.conflictDetectionService.getScheduleConflicts(schedule.id);
        return ok({ schedule, conflicts });
      } catch (err: unknown) {
        return fail({
          code: 'INTERNAL_ERROR',
          message: err instanceof Error ? err.message : 'Unknown error',
        });
      }
    },
    resolveConflict: async (id, data) => {
      const { resolution, newStartTime, newEndTime, newDuration } = data;

      try {
        const currentEvent = await useCases.scheduleEventService.getSchedule(id);
        if (!currentEvent) {
          return fail({ code: 'NOT_FOUND', message: '日程不存在' });
        }

        switch (resolution) {
          case 'REJECT': {
            return fail({
              code: 'CONFLICT_REJECTED',
              message: 'Schedule conflict was rejected by the user',
            });
          }

          case 'AUTO': {
            const conflicts = await useCases.conflictDetectionService.getScheduleConflicts(id);
            if (!conflicts.hasConflict || conflicts.suggestions.length === 0) {
              return ok({
                schedule: currentEvent,
                conflicts,
                applied: { strategy: resolution, changes: ['No conflicts to resolve'] },
              });
            }

            const suggestion = conflicts.suggestions[0];
            const event = await useCases.scheduleEventService.updateSchedule(id, {
              startTime: suggestion.newStartTime,
              endTime: suggestion.newEndTime,
            });
            return ok({
              schedule: event,
              conflicts,
              applied: {
                strategy: resolution,
                previousStartTime: currentEvent.startTime,
                previousEndTime: currentEvent.endTime,
                changes: [
                  `Auto-resolved using ${suggestion.type}: moved to ${suggestion.newStartTime}-${suggestion.newEndTime}`,
                ],
              },
            });
          }

          case 'ADJUST_START_TIME': {
            const conflicts = await useCases.conflictDetectionService.getScheduleConflicts(id);
            if (!conflicts.hasConflict) {
              return ok({
                schedule: currentEvent,
                conflicts,
                applied: { strategy: resolution, changes: ['No conflicts to resolve'] },
              });
            }

            const latestOverlapEnd = Math.max(...conflicts.conflicts.map((c) => c.overlapEnd));
            const duration = currentEvent.endTime - currentEvent.startTime;
            const adjustedStartTime = newStartTime ?? latestOverlapEnd;
            const adjustedEndTime = adjustedStartTime + duration;
            const event = await useCases.scheduleEventService.updateSchedule(id, {
              startTime: adjustedStartTime,
              endTime: adjustedEndTime,
            });
            return ok({
              schedule: event,
              conflicts,
              applied: {
                strategy: resolution,
                previousStartTime: currentEvent.startTime,
                previousEndTime: currentEvent.endTime,
                changes: [
                  `Adjusted start time from ${currentEvent.startTime} to ${adjustedStartTime}`,
                ],
              },
            });
          }

          case 'ADJUST_END_TIME': {
            const conflicts = await useCases.conflictDetectionService.getScheduleConflicts(id);
            if (!conflicts.hasConflict) {
              return ok({
                schedule: currentEvent,
                conflicts,
                applied: { strategy: resolution, changes: ['No conflicts to resolve'] },
              });
            }

            const earliestOverlapStart = Math.min(
              ...conflicts.conflicts.map((c) => c.overlapStart),
            );
            const adjustedEndTime = newEndTime ?? earliestOverlapStart;
            if (adjustedEndTime <= currentEvent.startTime) {
              return fail({
                code: 'VALIDATION_ERROR',
                message: 'Cannot adjust end time: would result in zero or negative duration',
              });
            }

            const event = await useCases.scheduleEventService.updateSchedule(id, {
              endTime: adjustedEndTime,
            });
            return ok({
              schedule: event,
              conflicts,
              applied: {
                strategy: resolution,
                previousStartTime: currentEvent.startTime,
                previousEndTime: currentEvent.endTime,
                changes: [`Adjusted end time from ${currentEvent.endTime} to ${adjustedEndTime}`],
              },
            });
          }

          case 'ADJUST_DURATION': {
            const conflicts = await useCases.conflictDetectionService.getScheduleConflicts(id);
            if (!conflicts.hasConflict) {
              return ok({
                schedule: currentEvent,
                conflicts,
                applied: { strategy: resolution, changes: ['No conflicts to resolve'] },
              });
            }

            const earliestOverlapStart = Math.min(
              ...conflicts.conflicts.map((c) => c.overlapStart),
            );
            const adjustedEndTime = newDuration
              ? currentEvent.startTime + newDuration * 60000
              : earliestOverlapStart;
            if (adjustedEndTime <= currentEvent.startTime) {
              return fail({
                code: 'VALIDATION_ERROR',
                message: 'Cannot adjust duration: would result in zero or negative duration',
              });
            }

            const event = await useCases.scheduleEventService.updateSchedule(id, {
              endTime: adjustedEndTime,
            });
            return ok({
              schedule: event,
              conflicts,
              applied: {
                strategy: resolution,
                previousStartTime: currentEvent.startTime,
                previousEndTime: currentEvent.endTime,
                changes: [
                  `Adjusted duration: end time changed from ${currentEvent.endTime} to ${adjustedEndTime}`,
                ],
              },
            });
          }

          default: {
            return fail({
              code: 'VALIDATION_ERROR',
              message: `Unknown resolution strategy: ${resolution}`,
            });
          }
        }
      } catch (err: unknown) {
        if (err instanceof Error && err.message.includes('not found')) {
          return fail({ code: 'NOT_FOUND', message: err.message });
        }
        return fail({
          code: 'INTERNAL_ERROR',
          message: err instanceof Error ? err.message : 'Unknown error',
        });
      }
    },
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
