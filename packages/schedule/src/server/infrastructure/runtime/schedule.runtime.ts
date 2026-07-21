import { createTypedEventSubscriber, eventBus } from '@dailyuse/utils/domain';
import { createLogger } from '@dailyuse/utils/logger';
import { ExecutionStatus, ScheduleTaskStatus } from '@dailyuse/contracts/schedule';
import type { ScheduleEventMap } from '@dailyuse/contracts/schedule';
import type { ScheduleTask } from '../../domain/aggregates/schedule-task';
import type { IScheduleTaskRepository } from '../../domain/repositories/i-schedule-task-repository';
import type {
  ScheduleTaskExecutionResult,
  ScheduleTaskSourceExecutor,
} from '../../application/source-executors/runtime-contract';
import { ScheduleTaskQueue, type ScheduledItem } from '../../application/scheduler/schedule-task-queue';
import type { ScheduleModuleRuntimeContribution } from '../schedule.module';

const logger = createLogger('ScheduleRuntime');

export type ScheduleRuntimeContribution = ScheduleModuleRuntimeContribution;
export type ScheduleRuntimeContributionsInput =
  | ScheduleRuntimeContribution
  | readonly ScheduleRuntimeContribution[];
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

type ScheduleRuntimeEventMap = Pick<ScheduleEventMap, SyncTaskEventName | RemoveTaskEventName>;

const scheduleRuntimeEvents = createTypedEventSubscriber<ScheduleRuntimeEventMap>(eventBus);

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
    identityId: String(task.identityId),
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

async function loadTaskForRuntime(
  repository: IScheduleTaskRepository,
  taskId: string,
  identityId?: string | null,
): Promise<ScheduleTask | null> {
  if (identityId) {
    return repository.findByIdForIdentity(String(identityId), taskId);
  }

  const task = await repository.findById(taskId);
  if (!task) {
    return null;
  }

  // Defense in depth: once identity is known from the aggregate, re-load owned.
  return repository.findByIdForIdentity(String(task.identityId), taskId);
}

async function syncTask(
  repository: IScheduleTaskRepository,
  queue: ScheduleTaskQueue,
  taskId: string,
  shouldScheduleTask?: (task: ScheduleTask) => boolean | Promise<boolean>,
  identityId?: string | null,
): Promise<void> {
  const task = await loadTaskForRuntime(repository, taskId, identityId);
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
  identityId?: string | null,
): Promise<void> {
  const task = await loadTaskForRuntime(repository, taskId, identityId);
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
    onExecuteTask: async (taskId, item) => {
      await executeScheduledTask(
        deps.scheduleTaskRepository,
        deps.sourceExecutor,
        taskId,
        deps.shouldScheduleTask,
        item.identityId,
      );
    },
    onExecuteError: (taskId, error) => {
      logger.error('[Schedule] Queue execution failed', { taskId, error: error.message });
    },
  });

  const syncTaskHandler = async (event: { taskId?: string; identityId?: string }) => {
    const taskId = event.taskId;
    if (!taskId) {
      return;
    }

    logger.info('[Schedule] Received task sync event', { taskId, identityId: event.identityId });
    await syncTask(
      deps.scheduleTaskRepository,
      queue,
      taskId,
      deps.shouldScheduleTask,
      event.identityId,
    );
  };

  const removeTaskHandler = (event: { taskId?: string }) => {
    const taskId = event.taskId;
    if (!taskId) {
      return;
    }

    logger.info('[Schedule] Received task removal event', { taskId });
    queue.removeTask(taskId);
  };

  const createSyncTaskListener = <K extends SyncTaskEventName>(eventName: K) => {
    return (event: ScheduleEventMap[K]) => {
      void syncTaskHandler(event).catch((error) => {
        logger.error('[Schedule] Task sync event handler failed', {
          event: eventName,
          taskId: event.taskId,
          error: error instanceof Error ? error.message : String(error),
        });
      });
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

  const registerListeners = () => {
    scheduleRuntimeEvents.on('schedule:task-created', syncTaskListeners['schedule:task-created']);
    scheduleRuntimeEvents.on(
      'schedule:task-schedule-updated',
      syncTaskListeners['schedule:task-schedule-updated'],
    );
    scheduleRuntimeEvents.on('schedule:task-resumed', syncTaskListeners['schedule:task-resumed']);
    scheduleRuntimeEvents.on('schedule:task-executed', syncTaskListeners['schedule:task-executed']);
    scheduleRuntimeEvents.on('schedule:task-paused', removeTaskListeners['schedule:task-paused']);
    scheduleRuntimeEvents.on('schedule:task-completed', removeTaskListeners['schedule:task-completed']);
    scheduleRuntimeEvents.on('schedule:task-cancelled', removeTaskListeners['schedule:task-cancelled']);
    scheduleRuntimeEvents.on('schedule:task-failed', removeTaskListeners['schedule:task-failed']);
    scheduleRuntimeEvents.on('schedule:task-deleted', removeTaskListeners['schedule:task-deleted']);
  };

  const unregisterListeners = () => {
    scheduleRuntimeEvents.off('schedule:task-created', syncTaskListeners['schedule:task-created']);
    scheduleRuntimeEvents.off(
      'schedule:task-schedule-updated',
      syncTaskListeners['schedule:task-schedule-updated'],
    );
    scheduleRuntimeEvents.off('schedule:task-resumed', syncTaskListeners['schedule:task-resumed']);
    scheduleRuntimeEvents.off('schedule:task-executed', syncTaskListeners['schedule:task-executed']);
    scheduleRuntimeEvents.off('schedule:task-paused', removeTaskListeners['schedule:task-paused']);
    scheduleRuntimeEvents.off('schedule:task-completed', removeTaskListeners['schedule:task-completed']);
    scheduleRuntimeEvents.off('schedule:task-cancelled', removeTaskListeners['schedule:task-cancelled']);
    scheduleRuntimeEvents.off('schedule:task-failed', removeTaskListeners['schedule:task-failed']);
    scheduleRuntimeEvents.off('schedule:task-deleted', removeTaskListeners['schedule:task-deleted']);
  };

  let started = false;
  let starting: Promise<void> | null = null;

  return {
    start(): Promise<void> {
      if (started) {
        return Promise.resolve();
      }

      if (starting) {
        return starting;
      }

      starting = (async () => {
        registerListeners();

        try {
          await queue.start();
          started = true;
          logger.info('[Schedule] Runtime contribution started');
        } catch (error) {
          unregisterListeners();
          throw error;
        } finally {
          starting = null;
        }
      })();

      return starting;
    },

    stop(): void {
      if (!started) {
        return;
      }

      unregisterListeners();
      queue.stop();
      started = false;
      logger.info('[Schedule] Runtime contribution stopped');
    },
  };
}
