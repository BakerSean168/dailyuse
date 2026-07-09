import { beforeEach, describe, expect, it, vi } from 'vitest';
import {
  ExecutionStatus,
  ScheduleTaskStatus,
  SourceModule,
  Timezone,
} from '@dailyuse/contracts/schedule';
import { ScheduleTask } from '@/server/domain/aggregates/schedule-task';
import type { IScheduleTaskRepository } from '@/server/domain/repositories/i-schedule-task-repository';
import { ExecutionInfo, RetryPolicy, ScheduleConfig, ScheduleTaskMetadata } from '@/server/domain/value-objects';
import { ScheduleTaskId } from '@/server/domain/value-objects/schedule-task-id';

const mocked = vi.hoisted(() => {
  const handlers = new Map<string, Set<(payload: unknown) => void>>();
  const queueInstances: Array<Record<string, unknown>> = [];
  const loggerInfo = vi.fn();
  const loggerWarn = vi.fn();
  const loggerError = vi.fn();

  const on = vi.fn((event: string, handler: (payload: unknown) => void) => {
    const eventHandlers = handlers.get(event) ?? new Set<(payload: unknown) => void>();
    eventHandlers.add(handler);
    handlers.set(event, eventHandlers);
  });

  const off = vi.fn((event: string, handler: (payload: unknown) => void) => {
    handlers.get(event)?.delete(handler);
  });

  const emit = (event: string, payload: unknown) => {
    for (const handler of [...(handlers.get(event) ?? [])]) {
      handler(payload);
    }
  };

  const reset = () => {
    handlers.clear();
    queueInstances.length = 0;
    on.mockClear();
    off.mockClear();
    loggerInfo.mockClear();
    loggerWarn.mockClear();
    loggerError.mockClear();
  };

  return {
    emit,
    eventBus: { on, off },
    loggerError,
    loggerInfo,
    loggerWarn,
    queueInstances,
    reset,
  };
});

vi.mock('@dailyuse/utils/domain', async (importOriginal) => {
  const actual = await importOriginal<typeof import('@dailyuse/utils/domain')>();

  return {
    ...actual,
    eventBus: mocked.eventBus,
    createTypedEventSubscriber: (source: typeof mocked.eventBus) => ({
      on: source.on,
      off: source.off,
    }),
  };
});

vi.mock('@dailyuse/utils/logger', () => ({
  createLogger: () => ({
    info: mocked.loggerInfo,
    warn: mocked.loggerWarn,
    error: mocked.loggerError,
  }),
}));

vi.mock('../../application/scheduler/schedule-task-queue', () => {
  class MockScheduleTaskQueue {
    public readonly addTask = vi.fn();
    public readonly removeTask = vi.fn();
    public readonly stop = vi.fn();
    public loadedItems: unknown[] = [];
    public startPromise: Promise<void> | null = null;

    constructor(public readonly config: Record<string, unknown>) {
      mocked.queueInstances.push(this as unknown as Record<string, unknown>);
    }

    start(): Promise<void> {
      this.startPromise = (async () => {
        const taskLoader = this.config.taskLoader as
          | { loadActiveTasks(): Promise<unknown[]> }
          | undefined;
        this.loadedItems = taskLoader ? await taskLoader.loadActiveTasks() : [];
      })();

      return this.startPromise;
    }
  }

  return { ScheduleTaskQueue: MockScheduleTaskQueue };
});

import { createScheduleRuntimeContribution } from './schedule.runtime';

interface MockQueueInstance {
  readonly addTask: ReturnType<typeof vi.fn>;
  readonly removeTask: ReturnType<typeof vi.fn>;
  readonly stop: ReturnType<typeof vi.fn>;
  readonly config: {
    readonly taskLoader?: { loadActiveTasks(): Promise<unknown[]> };
    readonly onExecuteTask: (taskId: string) => Promise<void>;
    readonly onExecuteError?: (taskId: string, error: Error) => void;
  };
  loadedItems: unknown[];
  startPromise: Promise<void> | null;
  start(): Promise<void>;
}

type ScheduleTaskRepositoryMock = IScheduleTaskRepository & {
  save: ReturnType<typeof vi.fn>;
  findById: ReturnType<typeof vi.fn>;
  deleteById: ReturnType<typeof vi.fn>;
  findByIdentityId: ReturnType<typeof vi.fn>;
  findBySourceModule: ReturnType<typeof vi.fn>;
  findBySourceEntity: ReturnType<typeof vi.fn>;
  findByStatus: ReturnType<typeof vi.fn>;
  findEnabled: ReturnType<typeof vi.fn>;
  findDueTasksForExecution: ReturnType<typeof vi.fn>;
  query: ReturnType<typeof vi.fn>;
  count: ReturnType<typeof vi.fn>;
  saveBatch: ReturnType<typeof vi.fn>;
  deleteBatch: ReturnType<typeof vi.fn>;
  withTransaction: ReturnType<typeof vi.fn>;
};

function createRepositoryMock(): ScheduleTaskRepositoryMock {
  const repository = {
    save: vi.fn(async () => undefined),
    findById: vi.fn(async () => null),
    deleteById: vi.fn(async () => undefined),
    findByIdentityId: vi.fn(async () => []),
    findBySourceModule: vi.fn(async () => []),
    findBySourceEntity: vi.fn(async () => []),
    findByStatus: vi.fn(async () => []),
    findEnabled: vi.fn(async () => []),
    findDueTasksForExecution: vi.fn(async () => []),
    query: vi.fn(async () => []),
    count: vi.fn(async () => 0),
    saveBatch: vi.fn(async () => undefined),
    deleteBatch: vi.fn(async () => undefined),
    withTransaction: vi.fn(),
  } as unknown as ScheduleTaskRepositoryMock;

  repository.withTransaction.mockImplementation(
    async (fn: (repo: IScheduleTaskRepository) => Promise<unknown>) => fn(repository),
  );

  return repository;
}

function recurringSchedule(): ScheduleConfig {
  return ScheduleConfig.fromDTO({
    cronExpression: '0 0 9 * * *',
    timezone: Timezone.Shanghai,
    startDate: null,
    endDate: null,
    maxExecutions: null,
  });
}

function oneShotPastSchedule(startTime: number): ScheduleConfig {
  return ScheduleConfig.fromDTO({
    cronExpression: null,
    timezone: Timezone.Shanghai,
    startDate: new Date(startTime).toISOString(),
    endDate: null,
    maxExecutions: 1,
  });
}

function createLoadedTask(
  overrides: Partial<{
    id: string;
    identityId: string;
    name: string;
    sourceModule: SourceModule;
    sourceEntityId: string;
    status: ScheduleTaskStatus;
    enabled: boolean;
    nextRunAt: number | null;
    retryPolicy: RetryPolicy;
    schedule: ScheduleConfig;
    metadata: ScheduleTaskMetadata;
  }> = {},
): ScheduleTask {
  const now = Date.now();
  const nextRunAt = overrides.nextRunAt ?? now + 60_000;

  return ScheduleTask.load({
    id: (overrides.id ?? ScheduleTaskId.generate()) as ReturnType<typeof ScheduleTaskId.generate>,
    identityId: overrides.identityId ?? 'identity-1',
    name: overrides.name ?? 'Runtime Task',
    description: null,
    sourceModule: overrides.sourceModule ?? SourceModule.Task,
    sourceEntityId: overrides.sourceEntityId ?? 'source-1',
    status: overrides.status ?? ScheduleTaskStatus.Active,
    enabled: overrides.enabled ?? true,
    schedule: overrides.schedule ?? recurringSchedule(),
    execution: ExecutionInfo.fromDTO({
      nextRunAt: nextRunAt === null ? null : new Date(nextRunAt).toISOString(),
      lastRunAt: null,
      executionCount: 0,
      lastExecutionStatus: null,
      lastExecutionDuration: null,
      consecutiveFailures: 0,
    }),
    retryPolicy: overrides.retryPolicy ?? RetryPolicy.createDefault(),
    metadata:
      overrides.metadata ??
      ScheduleTaskMetadata.create({
        payload: { foo: 'bar' },
        tags: ['runtime'],
        priority: 'Normal',
        timeout: null,
      }),
    createdAt: new Date(now),
    updatedAt: new Date(now),
    version: 1,
    deletedAt: null,
  });
}

async function flushAsyncWork(): Promise<void> {
  await Promise.resolve();
  await Promise.resolve();
  await Promise.resolve();
  await Promise.resolve();
}

function getLastQueue(): MockQueueInstance {
  const queue = mocked.queueInstances[mocked.queueInstances.length - 1] as MockQueueInstance | undefined;
  if (!queue) {
    throw new Error('Expected a mocked queue instance');
  }

  return queue;
}

describe('createScheduleRuntimeContribution', () => {
  beforeEach(() => {
    mocked.reset();
  });

  it('loads enabled tasks on start, filters them by shouldScheduleTask, and subscribes once', async () => {
    const allowedTask = createLoadedTask({ id: 'task-allowed' });
    const blockedTask = createLoadedTask({ id: 'task-blocked', identityId: 'identity-2' });
    const repository = createRepositoryMock();
    repository.findEnabled.mockResolvedValue([allowedTask, blockedTask]);

    const runtime = createScheduleRuntimeContribution({
      scheduleTaskRepository: repository,
      shouldScheduleTask: (task) => task.identityId === 'identity-1',
      sourceExecutor: { execute: vi.fn(async () => undefined) },
    });

    await runtime.start();
    const queue = getLastQueue();

    expect(repository.findEnabled).toHaveBeenCalledTimes(1);
    expect(queue.loadedItems).toEqual([
      expect.objectContaining({
        taskId: 'task-allowed',
        taskName: allowedTask.name,
        nextRunAt: allowedTask.execution.nextRunAt,
      }),
    ]);
    expect(mocked.eventBus.on).toHaveBeenCalledTimes(9);

    await runtime.start();
    expect(mocked.eventBus.on).toHaveBeenCalledTimes(9);
  });

  it('surfaces queue startup failures, unregisters listeners, and allows retry', async () => {
    const repository = createRepositoryMock();
    repository.findEnabled
      .mockRejectedValueOnce(new Error('loader failed'))
      .mockResolvedValueOnce([]);

    const runtime = createScheduleRuntimeContribution({
      scheduleTaskRepository: repository,
      sourceExecutor: { execute: vi.fn(async () => undefined) },
    });

    await expect(runtime.start()).rejects.toThrow('loader failed');

    expect(mocked.eventBus.on).toHaveBeenCalledTimes(9);
    expect(mocked.eventBus.off).toHaveBeenCalledTimes(9);
    expect(mocked.loggerInfo).not.toHaveBeenCalledWith('[Schedule] Runtime contribution started');

    await runtime.start();

    expect(repository.findEnabled).toHaveBeenCalledTimes(2);
    expect(mocked.eventBus.on).toHaveBeenCalledTimes(18);
    expect(mocked.loggerInfo).toHaveBeenCalledWith('[Schedule] Runtime contribution started');
  });

  it('syncs schedulable tasks into the queue for live runtime events', async () => {
    const task = createLoadedTask({ id: 'task-sync', nextRunAt: Date.now() + 120_000 });
    const repository = createRepositoryMock();
    repository.findById.mockResolvedValue(task);

    const runtime = createScheduleRuntimeContribution({
      scheduleTaskRepository: repository,
      sourceExecutor: { execute: vi.fn(async () => undefined) },
    });

    await runtime.start();
    const queue = getLastQueue();

    for (const eventName of [
      'schedule:task-created',
      'schedule:task-schedule-updated',
      'schedule:task-resumed',
      'schedule:task-executed',
    ]) {
      mocked.emit(eventName, { taskId: task.id });
    }
    await flushAsyncWork();

    expect(repository.findById).toHaveBeenCalledTimes(4);
    expect(queue.addTask).toHaveBeenCalledTimes(4);
    expect(queue.addTask).toHaveBeenNthCalledWith(
      1,
      expect.objectContaining({
        taskId: task.id,
        taskName: task.name,
        metadata: task.metadata.toDTO().payload,
      }),
    );
  });

  it('logs sync handler failures instead of leaking an unhandled rejection', async () => {
    const repository = createRepositoryMock();
    repository.findById.mockRejectedValue(new Error('db unavailable'));

    const runtime = createScheduleRuntimeContribution({
      scheduleTaskRepository: repository,
      sourceExecutor: { execute: vi.fn(async () => undefined) },
    });

    await runtime.start();

    const unhandled: unknown[] = [];
    const onUnhandled = (reason: unknown) => unhandled.push(reason);
    process.on('unhandledRejection', onUnhandled);
    try {
      mocked.emit('schedule:task-created', { taskId: 'task-error' });
      await flushAsyncWork();
    } finally {
      process.off('unhandledRejection', onUnhandled);
    }

    expect(unhandled).toHaveLength(0);
    expect(mocked.loggerError).toHaveBeenCalledWith(
      '[Schedule] Task sync event handler failed',
      expect.objectContaining({ event: 'schedule:task-created', taskId: 'task-error', error: 'db unavailable' }),
    );
  });

  it('removes tasks from the queue when sync finds a task outside the runtime scope', async () => {
    const task = createLoadedTask({ id: 'task-blocked' });
    const repository = createRepositoryMock();
    repository.findById.mockResolvedValue(task);

    const runtime = createScheduleRuntimeContribution({
      scheduleTaskRepository: repository,
      shouldScheduleTask: () => false,
      sourceExecutor: { execute: vi.fn(async () => undefined) },
    });

    await runtime.start();
    const queue = getLastQueue();

    mocked.emit('schedule:task-created', { taskId: task.id });
    await flushAsyncWork();

    expect(queue.addTask).not.toHaveBeenCalled();
    expect(queue.removeTask).toHaveBeenCalledWith(task.id);
  });

  it('removes queued tasks for pause, completion, cancellation, failure, and deletion events', async () => {
    const repository = createRepositoryMock();
    const runtime = createScheduleRuntimeContribution({
      scheduleTaskRepository: repository,
      sourceExecutor: { execute: vi.fn(async () => undefined) },
    });

    await runtime.start();
    const queue = getLastQueue();

    for (const eventName of [
      'schedule:task-paused',
      'schedule:task-completed',
      'schedule:task-cancelled',
      'schedule:task-failed',
      'schedule:task-deleted',
    ]) {
      mocked.emit(eventName, { taskId: 'task-remove' });
    }

    expect(queue.removeTask).toHaveBeenCalledTimes(5);
    expect(queue.removeTask).toHaveBeenNthCalledWith(1, 'task-remove');
  });

  it('executes due tasks through the source executor and persists the updated aggregate', async () => {
    const task = createLoadedTask({ id: 'task-execute', nextRunAt: Date.now() - 60_000 });
    const repository = createRepositoryMock();
    repository.findById.mockResolvedValue(task);
    const sourceExecutor = {
      execute: vi.fn(async () => ({ nextRunAt: Date.now() + 300_000, result: { ok: true } })),
    };

    createScheduleRuntimeContribution({
      scheduleTaskRepository: repository,
      sourceExecutor,
    });
    const queue = getLastQueue();

    await queue.config.onExecuteTask(task.id);

    expect(sourceExecutor.execute).toHaveBeenCalledWith(task);
    expect(repository.save).toHaveBeenCalledWith(task);
    expect(task.execution.executionCount).toBe(1);
    expect(task.execution.lastExecutionStatus).toBe(ExecutionStatus.Success);
    expect(task.status).toBe(ScheduleTaskStatus.Active);
  });

  it('marks execution as failed when source execution throws and no retry can be scheduled', async () => {
    const startTime = Date.now() - 120_000;
    const task = createLoadedTask({
      id: 'task-failure',
      nextRunAt: startTime,
      retryPolicy: RetryPolicy.createDisabled(),
      schedule: oneShotPastSchedule(startTime),
    });
    const repository = createRepositoryMock();
    repository.findById.mockResolvedValue(task);
    const sourceExecutor = {
      execute: vi.fn(async () => {
        throw new Error('boom');
      }),
    };

    createScheduleRuntimeContribution({
      scheduleTaskRepository: repository,
      sourceExecutor,
    });
    const queue = getLastQueue();

    await queue.config.onExecuteTask(task.id);

    expect(repository.save).toHaveBeenCalledWith(task);
    expect(task.execution.executionCount).toBe(1);
    expect(task.execution.lastExecutionStatus).toBe(ExecutionStatus.Failed);
    expect(task.status).toBe(ScheduleTaskStatus.Failed);
    expect(mocked.loggerError).toHaveBeenCalledWith(
      '[Schedule] Source executor failed',
      expect.objectContaining({ taskId: task.id, error: 'boom', retryScheduledAt: null }),
    );
  });

  it('logs queue execution failures through onExecuteError', () => {
    const repository = createRepositoryMock();
    createScheduleRuntimeContribution({
      scheduleTaskRepository: repository,
      sourceExecutor: { execute: vi.fn(async () => undefined) },
    });
    const queue = getLastQueue();
    const error = new Error('queue exploded');

    queue.config.onExecuteError?.('task-error', error);

    expect(mocked.loggerError).toHaveBeenCalledWith(
      '[Schedule] Queue execution failed',
      { taskId: 'task-error', error: 'queue exploded' },
    );
  });

  it('unsubscribes runtime listeners and stops the queue on stop', async () => {
    const repository = createRepositoryMock();
    const runtime = createScheduleRuntimeContribution({
      scheduleTaskRepository: repository,
      sourceExecutor: { execute: vi.fn(async () => undefined) },
    });

    await runtime.start();
    const queue = getLastQueue();

    runtime.stop();

    expect(mocked.eventBus.off).toHaveBeenCalledTimes(9);
    expect(queue.stop).toHaveBeenCalledTimes(1);
  });
});
