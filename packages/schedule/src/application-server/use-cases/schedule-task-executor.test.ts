import { beforeEach, describe, expect, it, vi } from 'vitest';
import { ScheduleTaskExecutor } from './schedule-task-executor';
import { ScheduleTaskStatus } from '@dailyuse/contracts/schedule';

describe('ScheduleTaskExecutor', () => {
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

  it('finds due tasks with default timestamp', async () => {
    repository.findDueTasksForExecution.mockResolvedValue([{ id: 'task-1' }]);
    const executor = new ScheduleTaskExecutor(repository, monitor);

    const tasks = await executor.findDueTasks();

    expect(repository.findDueTasksForExecution).toHaveBeenCalledTimes(1);
    expect(repository.findDueTasksForExecution.mock.calls[0][0]).toBeInstanceOf(Date);
    expect(repository.findDueTasksForExecution.mock.calls[0][1]).toBe(100);
    expect(tasks).toEqual([{ id: 'task-1' }]);
  });

  it('throws when finding due tasks fails', async () => {
    repository.findDueTasksForExecution.mockRejectedValue(new Error('query failed'));
    const executor = new ScheduleTaskExecutor(repository, monitor);

    await expect(executor.findDueTasks()).rejects.toThrow('query failed');
  });

  it('executes a task successfully and records monitor events', async () => {
    const task = {
      id: 'task-1',
      taskName: 'demo task',
      execute: vi.fn().mockReturnValue(true),
    } as any;
    repository.save.mockResolvedValue(undefined);
    const executor = new ScheduleTaskExecutor(repository, monitor);

    await executor.executeTask(task);

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
    const executor = new ScheduleTaskExecutor(repository, monitor);

    await expect(executor.executeTask(task)).rejects.toThrow('Task execution returned false');
    expect(monitor.recordExecutionFailure).toHaveBeenCalledTimes(1);
  });

  it('executeDueTasks reports executed, skipped and failed counts', async () => {
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
    const executor = new ScheduleTaskExecutor(repository, monitor);

    const stats = await executor.executeDueTasks();

    expect(stats.total).toBe(3);
    expect(stats.executed).toBe(1);
    expect(stats.skipped).toBe(1);
    expect(stats.failed).toBe(1);
    expect(monitor.recordExecutionSkipped).toHaveBeenCalledTimes(1);
  });

  it('executeTaskById throws when task is missing', async () => {
    repository.findById.mockResolvedValue(null);
    const executor = new ScheduleTaskExecutor(repository, monitor);

    await expect(executor.executeTaskById('task-1')).rejects.toThrow('任务不存在: task-1');
  });

  it('executeTaskById skips when task cannot execute', async () => {
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
    const executor = new ScheduleTaskExecutor(repository, monitor);
    const executeSpy = vi.spyOn(executor, 'executeTask');

    await executor.executeTaskById('task-1');

    expect(monitor.recordExecutionSkipped).toHaveBeenCalledTimes(1);
    expect(executeSpy).not.toHaveBeenCalled();
  });

  it('executeTaskById executes when task can run', async () => {
    const task = {
      id: 'task-1',
      taskName: 'demo',
      canExecute: vi.fn().mockReturnValue(true),
      execute: vi.fn().mockReturnValue(true),
    } as any;
    repository.findById.mockResolvedValue(task);
    repository.save.mockResolvedValue(undefined);
    const executor = new ScheduleTaskExecutor(repository, monitor);

    await executor.executeTaskById('task-1');

    expect(task.execute).toHaveBeenCalledTimes(1);
    expect(repository.save).toHaveBeenCalledWith(task);
  });

  it('getCannotExecuteReason covers each branch', () => {
    const executor = new ScheduleTaskExecutor(repository, monitor) as any;

    expect(
      executor.getCannotExecuteReason({
        status: ScheduleTaskStatus.Paused,
        enabled: true,
        nextRunAt: new Date(Date.now() - 1000),
        maxExecutions: null,
        executionCount: 0,
      }),
    ).toContain('任务状态不是 Active');

    expect(
      executor.getCannotExecuteReason({
        status: ScheduleTaskStatus.Active,
        enabled: false,
        nextRunAt: new Date(Date.now() - 1000),
        maxExecutions: null,
        executionCount: 0,
      }),
    ).toBe('任务未启用');

    expect(
      executor.getCannotExecuteReason({
        status: ScheduleTaskStatus.Active,
        enabled: true,
        nextRunAt: new Date(Date.now() + 60000),
        maxExecutions: null,
        executionCount: 0,
      }),
    ).toContain('任务尚未到执行时间');

    expect(
      executor.getCannotExecuteReason({
        status: ScheduleTaskStatus.Active,
        enabled: true,
        nextRunAt: new Date(Date.now() - 1000),
        maxExecutions: 1,
        executionCount: 1,
      }),
    ).toContain('已达到最大执行次数');

    expect(
      executor.getCannotExecuteReason({
        status: ScheduleTaskStatus.Active,
        enabled: true,
        nextRunAt: new Date(Date.now() - 1000),
        maxExecutions: null,
        executionCount: 0,
      }),
    ).toBe('未知原因');
  });
});
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { ScheduleTaskExecutor } from './schedule-task-executor';
import { ScheduleTaskStatus } from '@dailyuse/contracts/schedule';

describe('ScheduleTaskExecutor', () => {
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

  it('finds due tasks with default timestamp', async () => {
    repository.findDueTasksForExecution.mockResolvedValue([{ id: 'task-1' }]);
    const executor = new ScheduleTaskExecutor(repository, monitor);

    const tasks = await executor.findDueTasks();

    expect(repository.findDueTasksForExecution).toHaveBeenCalledTimes(1);
    expect(repository.findDueTasksForExecution.mock.calls[0][0]).toBeInstanceOf(Date);
    expect(repository.findDueTasksForExecution.mock.calls[0][1]).toBe(100);
    expect(tasks).toEqual([{ id: 'task-1' }]);
  });

  it('throws when finding due tasks fails', async () => {
    repository.findDueTasksForExecution.mockRejectedValue(new Error('query failed'));
    const executor = new ScheduleTaskExecutor(repository, monitor);

    await expect(executor.findDueTasks()).rejects.toThrow('query failed');
  });

  it('executes a task successfully and records monitor events', async () => {
    const task = {
      id: 'task-1',
      taskName: 'demo task',
      execute: vi.fn().mockReturnValue(true),
    } as any;
    repository.save.mockResolvedValue(undefined);
    const executor = new ScheduleTaskExecutor(repository, monitor);

    await executor.executeTask(task);

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
    const executor = new ScheduleTaskExecutor(repository, monitor);

    await expect(executor.executeTask(task)).rejects.toThrow('Task execution returned false');
    expect(monitor.recordExecutionFailure).toHaveBeenCalledTimes(1);
  });

  it('executeDueTasks reports executed, skipped and failed counts', async () => {
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
    const executor = new ScheduleTaskExecutor(repository, monitor);

    const stats = await executor.executeDueTasks();

    expect(stats.total).toBe(3);
    expect(stats.executed).toBe(1);
    expect(stats.skipped).toBe(1);
    expect(stats.failed).toBe(1);
    expect(monitor.recordExecutionSkipped).toHaveBeenCalledTimes(1);
  });

  it('executeTaskById throws when task is missing', async () => {
    repository.findById.mockResolvedValue(null);
    const executor = new ScheduleTaskExecutor(repository, monitor);

    await expect(executor.executeTaskById('task-1')).rejects.toThrow('任务不存在: task-1');
  });

  it('executeTaskById skips when task cannot execute', async () => {
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
    const executor = new ScheduleTaskExecutor(repository, monitor);
    const executeSpy = vi.spyOn(executor, 'executeTask');

    await executor.executeTaskById('task-1');

    expect(monitor.recordExecutionSkipped).toHaveBeenCalledTimes(1);
    expect(executeSpy).not.toHaveBeenCalled();
  });

  it('executeTaskById executes when task can run', async () => {
    const task = {
      id: 'task-1',
      taskName: 'demo',
      canExecute: vi.fn().mockReturnValue(true),
      execute: vi.fn().mockReturnValue(true),
    } as any;
    repository.findById.mockResolvedValue(task);
    repository.save.mockResolvedValue(undefined);
    const executor = new ScheduleTaskExecutor(repository, monitor);

    await executor.executeTaskById('task-1');

    expect(task.execute).toHaveBeenCalledTimes(1);
    expect(repository.save).toHaveBeenCalledWith(task);
  });

  it('getCannotExecuteReason covers each branch', () => {
    const executor = new ScheduleTaskExecutor(repository, monitor) as any;

    expect(
      executor.getCannotExecuteReason({
        status: ScheduleTaskStatus.Paused,
        enabled: true,
        nextRunAt: new Date(Date.now() - 1000),
        maxExecutions: null,
        executionCount: 0,
      }),
    ).toContain('任务状态不是 Active');

    expect(
      executor.getCannotExecuteReason({
        status: ScheduleTaskStatus.Active,
        enabled: false,
        nextRunAt: new Date(Date.now() - 1000),
        maxExecutions: null,
        executionCount: 0,
      }),
    ).toBe('任务未启用');

    expect(
      executor.getCannotExecuteReason({
        status: ScheduleTaskStatus.Active,
        enabled: true,
        nextRunAt: new Date(Date.now() + 60000),
        maxExecutions: null,
        executionCount: 0,
      }),
    ).toContain('任务尚未到执行时间');

    expect(
      executor.getCannotExecuteReason({
        status: ScheduleTaskStatus.Active,
        enabled: true,
        nextRunAt: new Date(Date.now() - 1000),
        maxExecutions: 1,
        executionCount: 1,
      }),
    ).toContain('已达到最大执行次数');

    expect(
      executor.getCannotExecuteReason({
        status: ScheduleTaskStatus.Active,
        enabled: true,
        nextRunAt: new Date(Date.now() - 1000),
        maxExecutions: null,
        executionCount: 0,
      }),
    ).toBe('未知原因');
  });
});
