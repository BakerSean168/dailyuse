import { describe, expect, it, vi } from 'vitest';
import { ok } from '@memoflow/contracts/result';
import { TaskInstanceHttpAdapter } from './task-instance-http.adapter';

describe('TaskInstanceHttpAdapter', () => {
  it('uses by-date-range endpoint for date range queries', async () => {
    const httpClient = {
      get: vi.fn().mockResolvedValue(ok([])),
    } as any;

    const adapter = new TaskInstanceHttpAdapter(httpClient);

    await adapter.getTaskInstancesByDateRange({
      startDate: 1_700_000_000_000,
      endDate: 1_700_086_399_999,
    });

    expect(httpClient.get).toHaveBeenCalledWith('/task-instances/by-date-range', {
      params: {
        startDate: 1_700_000_000_000,
        endDate: 1_700_086_399_999,
      },
    });
  });

  it('uses list endpoint when no date range is provided', async () => {
    const httpClient = {
      get: vi.fn().mockResolvedValue(ok([])),
    } as any;

    const adapter = new TaskInstanceHttpAdapter(httpClient);

    await adapter.getTaskInstances({
      status: 'Pending',
    });

    expect(httpClient.get).toHaveBeenCalledWith('/task-instances', {
      params: {
        status: 'Pending',
      },
    });
  });

  it('uses the occurrence reschedule endpoint with expectedVersion', async () => {
    const httpClient = {
      post: vi.fn().mockResolvedValue(ok({ id: 'TaskInstanceId_123' })),
    } as any;
    const adapter = new TaskInstanceHttpAdapter(httpClient);
    const request = {
      newTime: {
        timeType: 'TimePoint' as const,
        startDate: 1_787_860_800_000,
        timePoint: 16 * 60,
        timeRange: null,
      },
      expectedVersion: 4,
    };

    await adapter.rescheduleTaskInstance('TaskInstanceId_123', request);

    expect(httpClient.post).toHaveBeenCalledWith(
      '/task-instances/TaskInstanceId_123/reschedule',
      request,
    );
  });

  it('uses the uncomplete endpoint when restoring a completed instance', async () => {
    const httpClient = {
      post: vi.fn().mockResolvedValue(ok({ status: 'Pending' })),
    } as any;

    const adapter = new TaskInstanceHttpAdapter(httpClient);

    await adapter.uncompleteTaskInstance('TaskInstanceId_123');

    expect(httpClient.post).toHaveBeenCalledWith('/task-instances/TaskInstanceId_123/uncomplete');
  });
});
