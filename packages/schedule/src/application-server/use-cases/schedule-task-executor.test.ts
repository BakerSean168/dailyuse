import { beforeEach, describe, expect, it, vi } from 'vitest';
import { FindDueScheduleTasksUseCase } from './find-due-schedule-tasks.use-case';
import { ExecuteScheduleTaskUseCase } from './execute-schedule-task.use-case';
import { ExecuteDueScheduleTasksUseCase } from './execute-due-schedule-tasks.use-case';
import { ExecuteScheduleTaskByIdUseCase } from './execute-schedule-task-by-id.use-case';
import { getCannotExecuteReason } from './schedule-executor-helpers';
import { ScheduleTaskStatus } from '@dailyuse/contracts/schedule';

const repository = {
  findDueTasksForExecution: vi.fn(),
  save: vi.fn(),
  findById: vi.fn(),
} as any;

const monitor = {
  recordExecutionStart: vi.fn(),
  recordExecutionSuccess: vi.fn(),
  recordExecutionFailure: vi.fn(),
  recordExecutionSkipped: vi.fn(),
} as any;

beforeEach(() => {
  vi.clearAllMocks();
});

describe('FindDueScheduleTasksUseCase', () => {
  it('finds due tasks with default timestamp', async () => {
    repository.findDueTasksForExecution.mockResolvedValue([{ id: 'task-1' }]);
    const uc = new FindDueScheduleTasksUseCase(repository);

    const tasks = await uc.execute();

    expect(repository.findDueTasksForExecution).toHaveBeenCalledTimes(1);
    expect(repository.findDueTasksForExecution.mock.calls[0][0]).toBeInstanceOf(Date);
    expect(repository.findDueTasksForExecution.mock.calls[0][1]).toBe(100);
    expect(tasks).toEqual([{ id: 'task-1' }]);
  });

  it('throws when finding due tasks fails', async () => {
    repository.findDueTasksForExecution.mockRejectedValue(new Error('query failed'));
    const uc = new FindDueScheduleTasksUseCase(repository);

    await expect(uc.execute()).rejects.toThrow('query failed');
  });
});

describe('ExecuteScheduleTaskUseCase', () => {
  it('executes a task successfully and records monitor events', async () => {
    const task = {
      id: 'task-1',
      taskName: 'demo task',
      execute: vi.fn().mockReturnValue(true),
    } as any;
    repository.save.mockResolvedValue(undefined);
    const uc = new ExecuteScheduleTaskUseCase(repository, monitor);

    await uc.execute(task);

    expect(monitor.recordExecutionStart).toHaveBeenCalledWith('task-1', 'demo task');
    expect(task.execute).toHaveBeenCalledTimes(1);
    expect(repository.save).toHaveBeenCalledWith(task);
    expect(monitor.recordExecutionSuccess).toHaveBeenCalledWith('task-1', 'demo task');
  });

  it('records failure when task execute returns false', async () => {
    const task = {
      id: 'task-1',
      taskName: 'demo task',
      execute: vi.fn().mockReturnValue(false),
    } as any;
    const uc = new ExecuteScheduleTaskUseCase(repository, monitor);

    await expect(uc.execute(task)).rejects.toThrow('Task execution returned false');
    expect(monitor.recordExecutionFailure).toHaveBeenCalledTimes(1);
  });
});

describe('ExecuteDueScheduleTasksUseCase', () => {
  it('reports executed, skipped and failed counts', async () => {
    const executable = {
      id: 'task-exec',
      taskName: 'exec',
      canExecute: vi.fn().mockReturnValue(true),
      execute: vi.fn().mockReturnValue(true),
    } as any;
    const skipped = {
      id: 'task-skip',
      taskName: 'skip',
      canExecute: vi.fn().mockReturnValue(false),
      status: ScheduleTaskStatus.Paused,
      enabled: true,
      nextRunAt: new Date(Date.now() - 1000),
      maxExecutions: null,
      executionCount: 0,
    } as any;
    const failed = {
      id: 'task-fail',
      taskName: 'fail',
      canExecute: vi.fn().mockReturnValue(true),
      execute: vi.fn().mockImplementation(() => {
        throw new Error('boom');
      }),
    } as any;

    repository.findDueTasksForExecution.mockResolvedValue([executable, skipped, failed]);
    repository.save.mockResolvedValue(undefined);
    const uc = new ExecuteDueScheduleTasksUseCase(repository, monitor);

    const stats = await uc.execute();

    expect(stats.total).toBe(3);
    expect(stats.executed).toBe(1);
    expect(stats.skipped).toBe(1);
    expect(stats.failed).toBe(1);
    expect(monitor.recordExecutionSkipped).toHaveBeenCalledTimes(1);
  });
});

describe('ExecuteScheduleTaskByIdUseCase', () => {
  it('throws when task is missing', async () => {
    repository.findById.mockResolvedValue(null);
    const uc = new ExecuteScheduleTaskByIdUseCase(repository, monitor);

    await expect(uc.execute('task-1')).rejects.toThrow('任务不存在: task-1');
  });

  it('skips when task cannot execute', async () => {
    repository.findById.mockResolvedValue({
      id: 'task-1',
      taskName: 'demo',
      canExecute: vi.fn().mockReturnValue(false),
      status: ScheduleTaskStatus.Active,
      enabled: false,
      nextRunAt: new Date(Date.now() + 10000),
      maxExecutions: null,
      executionCount: 0,
    });
    const uc = new ExecuteScheduleTaskByIdUseCase(repository, monitor);

    await uc.execute('task-1');

    expect(monitor.recordExecutionSkipped).toHaveBeenCalledTimes(1);
    expect(repository.save).not.toHaveBeenCalled();
  });

  it('executes when task can run', async () => {
    const task = {
      id: 'task-1',
      taskName: 'demo',
      canExecute: vi.fn().mockReturnValue(true),
      execute: vi.fn().mockReturnValue(true),
    } as any;
    repository.findById.mockResolvedValue(task);
    repository.save.mockResolvedValue(undefined);
    const uc = new ExecuteScheduleTaskByIdUseCase(repository, monitor);

    await uc.execute('task-1');

    expect(task.execute).toHaveBeenCalledTimes(1);
    expect(repository.save).toHaveBeenCalledWith(task);
  });
});

describe('getCannotExecuteReason', () => {
  it('covers each branch', () => {
    expect(
      getCannotExecuteReason({
        status: ScheduleTaskStatus.Paused,
        enabled: true,
        nextRunAt: new Date(Date.now() - 1000),
        maxExecutions: null,
        executionCount: 0,
      } as any),
    ).toContain('任务状态不是 Active');

    expect(
      getCannotExecuteReason({
        status: ScheduleTaskStatus.Active,
        enabled: false,
        nextRunAt: new Date(Date.now() - 1000),
        maxExecutions: null,
        executionCount: 0,
      } as any),
    ).toBe('任务未启用');

    expect(
      getCannotExecuteReason({
        status: ScheduleTaskStatus.Active,
        enabled: true,
        nextRunAt: new Date(Date.now() + 60000),
        maxExecutions: null,
        executionCount: 0,
      } as any),
    ).toContain('任务尚未到执行时间');

    expect(
      getCannotExecuteReason({
        status: ScheduleTaskStatus.Active,
        enabled: true,
        nextRunAt: new Date(Date.now() - 1000),
        maxExecutions: 1,
        executionCount: 1,
      } as any),
    ).toContain('已达到最大执行次数');

    expect(
      getCannotExecuteReason({
        status: ScheduleTaskStatus.Active,
        enabled: true,
        nextRunAt: new Date(Date.now() - 1000),
        maxExecutions: null,
        executionCount: 0,
      } as any),
    ).toBe('未知原因');
  });
});
