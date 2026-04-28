import { describe, expect, it, vi } from 'vitest';
import { ScheduleTaskExecutorAdapter } from './schedule-task-executor-adapter';

describe('ScheduleTaskExecutorAdapter', () => {
  it('delegates execution to wrapped executor', async () => {
    const executor = {
      executeTaskById: vi.fn().mockResolvedValue(undefined),
    } as any;
    const adapter = new ScheduleTaskExecutorAdapter(executor);

    await adapter.execute('task-1');

    expect(executor.executeTaskById).toHaveBeenCalledWith('task-1');
  });

  it('rethrows errors from wrapped executor', async () => {
    const executor = {
      executeTaskById: vi.fn().mockRejectedValue(new Error('boom')),
    } as any;
    const adapter = new ScheduleTaskExecutorAdapter(executor);

    await expect(adapter.execute('task-1')).rejects.toThrow('boom');
  });
});
