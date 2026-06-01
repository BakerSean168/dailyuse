import { eventBus } from '@dailyuse/utils/domain';
import { createLogger } from '@dailyuse/utils/logger';
import { ExecutionStatus, ScheduleTaskStatus } from '@dailyuse/contracts/schedule';
import type { ScheduleEventMap } from '@dailyuse/contracts/schedule';
import type { ScheduleTask } from '../domain-server/aggregates/schedule-task';
import type { IScheduleTaskRepository } from '../domain-server/repositories/i-schedule-task-repository';
import type {
  ScheduleTaskExecutionResult,
  ScheduleTaskSourceExecutor,
} from '../application-server/source-executors/runtime-contract';
import { ScheduleTaskQueue, type ScheduledItem } from '../application-server/scheduler/schedule-task-queue';
import type { ScheduleModuleRuntimeContribution } from '../infrastructure-server';

const logger = createLogger('ScheduleRuntime');

export type ScheduleRuntimeContribution = ScheduleModuleRuntimeContribution;
export type { ScheduleTaskExecutionResult, ScheduleTaskSourceExecutor };

type SyncTaskEventName =
  | 'schedule:task-created'
  | 'schedule:task-schedule-updated'
  | 'schedule:task-resumed'
  | 'schedule:task-executed';

type RemoveTaskEventName =
  | 'schedule:task-paused'
  | 'schedule:task-completed'
  | 'schedule:task-cancelled'
  | 'schedule:task-failed'
  | 'schedule:task-deleted';

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

  const createSyncTaskListener = <K extends SyncTaskEventName>(_eventName: K) => {
    return (event: ScheduleEventMap[K]) => {
      void syncTaskHandler(event);
    };
  };

  const createRemoveTaskListener = <K extends RemoveTaskEventName>(_eventName: K) => {
    return (event: ScheduleEventMap[K]) => {
      removeTaskHandler(event);
    };
  };

  const syncTaskListeners = {
    'schedule:task-created': createSyncTaskListener('schedule:task-created'),
    'schedule:task-schedule-updated': createSyncTaskListener('schedule:task-schedule-updated'),
    'schedule:task-resumed': createSyncTaskListener('schedule:task-resumed'),
    'schedule:task-executed': createSyncTaskListener('schedule:task-executed'),
  } as const;

  const removeTaskListeners = {
    'schedule:task-paused': createRemoveTaskListener('schedule:task-paused'),
    'schedule:task-completed': createRemoveTaskListener('schedule:task-completed'),
    'schedule:task-cancelled': createRemoveTaskListener('schedule:task-cancelled'),
    'schedule:task-failed': createRemoveTaskListener('schedule:task-failed'),
    'schedule:task-deleted': createRemoveTaskListener('schedule:task-deleted'),
  } as const;

  let started = false;

  return {
    start(): void {
      if (started) {
        return;
      }

      eventBus.on('schedule:task-created', syncTaskListeners['schedule:task-created']);
      eventBus.on(
        'schedule:task-schedule-updated',
        syncTaskListeners['schedule:task-schedule-updated'],
      );
      eventBus.on('schedule:task-resumed', syncTaskListeners['schedule:task-resumed']);
      eventBus.on('schedule:task-executed', syncTaskListeners['schedule:task-executed']);
      eventBus.on('schedule:task-paused', removeTaskListeners['schedule:task-paused']);
      eventBus.on('schedule:task-completed', removeTaskListeners['schedule:task-completed']);
      eventBus.on('schedule:task-cancelled', removeTaskListeners['schedule:task-cancelled']);
      eventBus.on('schedule:task-failed', removeTaskListeners['schedule:task-failed']);
      eventBus.on('schedule:task-deleted', removeTaskListeners['schedule:task-deleted']);

      void queue.start();
      started = true;
      logger.info('[Schedule] Runtime contribution started');
    },

    stop(): void {
      if (!started) {
        return;
      }

      eventBus.off('schedule:task-created', syncTaskListeners['schedule:task-created']);
      eventBus.off(
        'schedule:task-schedule-updated',
        syncTaskListeners['schedule:task-schedule-updated'],
      );
      eventBus.off('schedule:task-resumed', syncTaskListeners['schedule:task-resumed']);
      eventBus.off('schedule:task-executed', syncTaskListeners['schedule:task-executed']);
      eventBus.off('schedule:task-paused', removeTaskListeners['schedule:task-paused']);
      eventBus.off('schedule:task-completed', removeTaskListeners['schedule:task-completed']);
      eventBus.off('schedule:task-cancelled', removeTaskListeners['schedule:task-cancelled']);
      eventBus.off('schedule:task-failed', removeTaskListeners['schedule:task-failed']);
      eventBus.off('schedule:task-deleted', removeTaskListeners['schedule:task-deleted']);

      queue.stop();
      started = false;
      logger.info('[Schedule] Runtime contribution stopped');
    },
  };
}
