import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import type { ITaskHandler } from '../interfaces';
import { IntervalScheduler } from './interval-scheduler';

vi.mock('@dailyuse/utils/logger', () => ({
  createLogger: () => ({
    info: vi.fn(),
    warn: vi.fn(),
    error: vi.fn(),
    debug: vi.fn(),
  }),
}));

describe('IntervalScheduler', () => {
  let scheduler: IntervalScheduler;
  let handler: ITaskHandler;

  beforeEach(() => {
    vi.useFakeTimers();
    scheduler = new IntervalScheduler();
    handler = {
      execute: vi.fn().mockResolvedValue(undefined),
    };
  });

  afterEach(async () => {
    await scheduler.stop();
    vi.useRealTimers();
    vi.restoreAllMocks();
  });

  it('registers interval tasks and exposes their registration state', async () => {
    await scheduler.register('heartbeat', 1_000, handler);

    expect(scheduler.isRegistered('heartbeat')).toBe(true);
    expect(scheduler.getRegisteredTasks()).toEqual(['heartbeat']);
  });

  it('rejects unsupported or unsafe schedules', async () => {
    await expect(scheduler.register('cron-task', '* * * * *', handler)).rejects.toThrow(
      'does not support Cron expressions',
    );
    await expect(scheduler.register('too-fast', 99, handler)).rejects.toThrow(
      'at least 100ms',
    );
  });

  it('prevents duplicate task registration', async () => {
    await scheduler.register('heartbeat', 1_000, handler);

    await expect(scheduler.register('heartbeat', 1_000, handler)).rejects.toThrow(
      'already registered',
    );
  });

  it('executes registered handlers after start and stops future ticks', async () => {
    await scheduler.register('heartbeat', 1_000, handler);
    await scheduler.start();

    await vi.advanceTimersByTimeAsync(2_500);
    expect(handler.execute).toHaveBeenCalledTimes(2);
    expect(handler.execute).toHaveBeenNthCalledWith(1, 'heartbeat');

    await scheduler.stop();
    await vi.advanceTimersByTimeAsync(2_000);
    expect(handler.execute).toHaveBeenCalledTimes(2);
    expect(scheduler.isRunning_()).toBe(false);
  });

  it('starts tasks registered while the scheduler is already running', async () => {
    await scheduler.start();
    await scheduler.register('late-task', 500, handler);

    await vi.advanceTimersByTimeAsync(1_100);

    expect(handler.execute).toHaveBeenCalledTimes(2);
    expect(handler.execute).toHaveBeenLastCalledWith('late-task');
  });

  it('unregisters running tasks and clears their intervals', async () => {
    await scheduler.register('heartbeat', 1_000, handler);
    await scheduler.start();
    await vi.advanceTimersByTimeAsync(1_000);

    await scheduler.unregister('heartbeat');
    await vi.advanceTimersByTimeAsync(2_000);

    expect(handler.execute).toHaveBeenCalledTimes(1);
    expect(scheduler.isRegistered('heartbeat')).toBe(false);
    expect(scheduler.getRegisteredTasks()).toEqual([]);
  });
});
