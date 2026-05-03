import { describe, expect, it, vi } from 'vitest';
import { ScheduleTaskExecutorAdapter } from './schedule-task-executor-adapter';

describe('ScheduleTaskExecutorAdapter', () => {
  it('delegates execution to wrapped use case', async () => {
    const executeById = {
      execute: vi.fn().mockResolvedValue(undefined),
    } as any;
    const adapter = new ScheduleTaskExecutorAdapter(executeById);

    await adapter.execute('task-1');

    expect(executeById.execute).toHaveBeenCalledWith('task-1');
  });

  it('rethrows errors from wrapped use case', async () => {
    const executeById = {
      execute: vi.fn().mockRejectedValue(new Error('boom')),
    } as any;
    const adapter = new ScheduleTaskExecutorAdapter(executeById);

    await expect(adapter.execute('task-1')).rejects.toThrow('boom');
  });
});
