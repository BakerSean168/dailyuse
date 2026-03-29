import { describe, expect, it, vi } from 'vitest';
import { ok } from '@dailyuse/contracts/result';
import { TaskInstanceHttpAdapter } from './task-instance-http.adapter';

describe('TaskInstanceHttpAdapter', () => {
  it('uses by-date-range endpoint for date range queries', async () => {
    const httpClient = {
      get: vi.fn().mockResolvedValue(ok([])),
    } as any;

    const adapter = new TaskInstanceHttpAdapter(httpClient);

    await adapter.getTaskInstancesByDateRange(1_700_000_000_000, 1_700_086_399_999);

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
});
