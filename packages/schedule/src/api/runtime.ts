import { createLogger, eventBus } from '@dailyuse/utils';
import { ExecutionStatus, ScheduleTaskStatus } from '@dailyuse/contracts/schedule';
import type { ScheduleTask } from '../domain-server/aggregates/schedule-task';
import type { IScheduleTaskRepository } from '../domain-server/repositories/i-schedule-task-repository';
import { ScheduleTaskQueue, type ScheduledItem } from '../application-server/scheduler/schedule-task-queue';
import type { ScheduleModuleRuntimeContribution } from '../infrastructure-server';

const logger = createLogger('ScheduleRuntime');

export type ScheduleRuntimeContribution = ScheduleModuleRuntimeContribution;

export interface ScheduleTaskExecutionResult {
  readonly nextRunAt?: number | null;
  readonly result?: Record<string, unknown>;
}

export interface ScheduleTaskSourceExecutor {
  execute(task: ScheduleTask): Promise<ScheduleTaskExecutionResult | void>;
}

export interface ScheduleRuntimeDependencies {
  readonly scheduleTaskRepository: IScheduleTaskRepository;
  readonly sourceExecutor: ScheduleTaskSourceExecutor;
  readonly shouldScheduleTask?: (task: ScheduleTask) => boolean | Promise<boolean>;
}

function toScheduledItem(task: ScheduleTask): ScheduledItem | null {
  const nextRunAt = task.execution.nextRunAt;
  if (!task.enabled || task.status !== ScheduleTaskStatus.Active || nextRunAt === null) {
    return null;
  }

  return {
    taskId: task.id,
    taskName: task.name,
    cronExpression: task.schedule.cronExpression,
    timezone: task.schedule.timezone,
    nextRunAt,
    metadata: task.metadata.toDTO().payload,
  };
}

async function isTaskAllowed(
  task: ScheduleTask,
  predicate?: (task: ScheduleTask) => boolean | Promise<boolean>,
): Promise<boolean> {
  if (!predicate) {
    return true;
  }

  return await predicate(task);
}

async function syncTask(
  repository: IScheduleTaskRepository,
  queue: ScheduleTaskQueue,
  taskId: string,
  shouldScheduleTask?: (task: ScheduleTask) => boolean | Promise<boolean>,
): Promise<void> {
  const task = await repository.findById(taskId);
  if (!task) {
    queue.removeTask(taskId);
    return;
  }

  if (!(await isTaskAllowed(task, shouldScheduleTask))) {
    logger.info('[Schedule] Removing task from queue because it does not match runtime auth scope', {
      taskId,
      taskName: task.name,
      identityId: String(task.identityId),
    });
    queue.removeTask(taskId);
    return;
  }

  const item = toScheduledItem(task);
  if (!item) {
    logger.warn('[Schedule] Removing task from queue because it is no longer schedulable', {
      taskId,
      exists: true,
      status: task.status,
      enabled: task.enabled,
      nextRunAt: task.execution.nextRunAt,
    });
    queue.removeTask(taskId);
    return;
  }

  logger.info('[Schedule] Syncing task into queue', {
    taskId,
    taskName: task.name,
    sourceModule: task.sourceModule,
    sourceEntityId: task.sourceEntityId,
    nextRunAt: item.nextRunAt,
  });
  queue.addTask(item);
}

async function executeScheduledTask(
  repository: IScheduleTaskRepository,
  sourceExecutor: ScheduleTaskSourceExecutor,
  taskId: string,
  shouldScheduleTask?: (task: ScheduleTask) => boolean | Promise<boolean>,
): Promise<void> {
  const task = await repository.findById(taskId);
  if (!task) {
    logger.warn('[Schedule] Scheduled execution skipped because task no longer exists', { taskId });
    return;
  }

  if (!(await isTaskAllowed(task, shouldScheduleTask))) {
    logger.info('[Schedule] Scheduled execution skipped because task does not match runtime auth scope', {
      taskId,
      taskName: task.name,
      identityId: String(task.identityId),
    });
    return;
  }

  const startedAt = Date.now();
  let status: (typeof ExecutionStatus)[keyof typeof ExecutionStatus] = ExecutionStatus.Success;
  let errorMessage: string | undefined;
  let result: Record<string, unknown> | undefined;
  let nextRunAt: number | null | undefined;

  if (!task.execute()) {
    status = ExecutionStatus.Skipped;
    errorMessage = 'Task is not executable';
    nextRunAt = task.calculateNextRun();
    logger.warn('[Schedule] Task was dequeued but not executable', {
      taskId,
      taskName: task.name,
      status: task.status,
      enabled: task.enabled,
      nextRunAt,
    });
  } else {
    try {
      logger.info('[Schedule] Executing task via source executor', {
        taskId,
        taskName: task.name,
        sourceModule: task.sourceModule,
        sourceEntityId: task.sourceEntityId,
      });
      const executionResult = await sourceExecutor.execute(task);
      result = executionResult?.result;
      nextRunAt = executionResult?.nextRunAt ?? task.calculateNextRun();
      logger.info('[Schedule] Source executor completed', {
        taskId,
        sourceModule: task.sourceModule,
        nextRunAt,
        result,
      });
    } catch (error) {
      status = ExecutionStatus.Failed;
      errorMessage = error instanceof Error ? error.message : String(error);
      nextRunAt = task.shouldRetry()
        ? Date.now() + task.calculateNextRetryDelay()
        : task.calculateNextRun();
      logger.error('[Schedule] Source executor failed', {
        taskId,
        sourceModule: task.sourceModule,
        error: errorMessage,
        retryScheduledAt: nextRunAt,
      });
    }
  }

  task.recordExecution(status, Date.now() - startedAt, result, errorMessage, nextRunAt);

  if (status === ExecutionStatus.Failed && nextRunAt === null) {
    task.fail(errorMessage ?? 'Unknown schedule execution failure');
  }

  if (status === ExecutionStatus.Success && nextRunAt === null) {
    task.complete();
  }

  await repository.save(task);
}

export function createScheduleRuntimeContribution(
  deps: ScheduleRuntimeDependencies,
): ScheduleRuntimeContribution {
  const queue = new ScheduleTaskQueue({
    taskLoader: {
      async loadActiveTasks() {
        const tasks = await deps.scheduleTaskRepository.findEnabled();
        const eligibleTasks = deps.shouldScheduleTask
          ? (
              await Promise.all(
                tasks.map(async (task) =>
                  (await isTaskAllowed(task, deps.shouldScheduleTask)) ? task : null,
                ),
              )
            ).filter((task): task is ScheduleTask => task !== null)
          : tasks;

        return eligibleTasks
          .map((task) => toScheduledItem(task))
          .filter((item): item is ScheduledItem => item !== null);
      },
    },
    onExecuteTask: async (taskId) => {
      await executeScheduledTask(
        deps.scheduleTaskRepository,
        deps.sourceExecutor,
        taskId,
        deps.shouldScheduleTask,
      );
    },
    onExecuteError: (taskId, error) => {
      logger.error('[Schedule] Queue execution failed', { taskId, error: error.message });
    },
  });

  const syncTaskHandler = async (event: { taskId?: string }) => {
    const taskId = event.taskId;
    if (!taskId) {
      return;
    }

    logger.info('[Schedule] Received task sync event', { taskId });
    await syncTask(deps.scheduleTaskRepository, queue, taskId, deps.shouldScheduleTask);
  };

  const removeTaskHandler = (event: { taskId?: string }) => {
    const taskId = event.taskId;
    if (!taskId) {
      return;
    }

    logger.info('[Schedule] Received task removal event', { taskId });
    queue.removeTask(taskId);
  };

  let started = false;

  return {
    start(): void {
      if (started) {
        return;
      }

      eventBus.on('schedule:task-created', syncTaskHandler as any);
      eventBus.on('schedule:task-schedule-updated', syncTaskHandler as any);
      eventBus.on('schedule:task-resumed', syncTaskHandler as any);
      eventBus.on('schedule:task-executed', syncTaskHandler as any);
      eventBus.on('schedule:task-paused', removeTaskHandler as any);
      eventBus.on('schedule:task-completed', removeTaskHandler as any);
      eventBus.on('schedule:task-cancelled', removeTaskHandler as any);
      eventBus.on('schedule:task-failed', removeTaskHandler as any);
      eventBus.on('schedule:task-deleted', removeTaskHandler as any);

      void queue.start();
      started = true;
      logger.info('[Schedule] Runtime contribution started');
    },

    stop(): void {
      if (!started) {
        return;
      }

      eventBus.off('schedule:task-created', syncTaskHandler as any);
      eventBus.off('schedule:task-schedule-updated', syncTaskHandler as any);
      eventBus.off('schedule:task-resumed', syncTaskHandler as any);
      eventBus.off('schedule:task-executed', syncTaskHandler as any);
      eventBus.off('schedule:task-paused', removeTaskHandler as any);
      eventBus.off('schedule:task-completed', removeTaskHandler as any);
      eventBus.off('schedule:task-cancelled', removeTaskHandler as any);
      eventBus.off('schedule:task-failed', removeTaskHandler as any);
      eventBus.off('schedule:task-deleted', removeTaskHandler as any);

      queue.stop();
      started = false;
      logger.info('[Schedule] Runtime contribution stopped');
    },
  };
}
