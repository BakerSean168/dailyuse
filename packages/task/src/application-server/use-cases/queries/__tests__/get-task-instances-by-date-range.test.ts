import { describe, it, expect, vi, beforeEach } from 'vitest';
import '@dailyuse/test-utils/helpers/result-matchers';
import { createMockRepo } from '@dailyuse/test-utils/mocks';
import { aTaskInstance, anIdentityId } from '@dailyuse/test-utils/fixtures';
import type { ITaskInstanceRepository } from '@/domain-server/repositories/ITaskInstanceRepository';
import { GetTaskInstancesByDateRange } from '../get-task-instances-by-date-range';

describe('GetTaskInstancesByDateRange', () => {
  let instanceRepo: ReturnType<typeof createMockRepo<ITaskInstanceRepository>>;
  let useCase: GetTaskInstancesByDateRange;

  beforeEach(() => {
    vi.clearAllMocks();
    instanceRepo = createMockRepo<ITaskInstanceRepository>({
      findByDateRange: vi.fn().mockResolvedValue([]),
    });
    useCase = new GetTaskInstancesByDateRange(instanceRepo);
  });

  it('should return empty data with total=0 when no instances in range', async () => {
    const identityId = anIdentityId();
    const startDate = Date.now();
    const endDate = startDate + 86400000;

    const result = await useCase.execute(identityId, startDate, endDate);

    expect(result).toBeOk();
    if (result.ok) {
      expect(result.data.data).toEqual([]);
      expect(result.data.total).toBe(0);
    }
  });

  it('should return instance DTOs with correct total', async () => {
    const instance1 = await aTaskInstance();
    const instance2 = await aTaskInstance();
    const instance3 = await aTaskInstance();
    vi.mocked(instanceRepo.findByDateRange).mockResolvedValue([instance1, instance2, instance3]);

    const result = await useCase.execute(anIdentityId(), 0, Date.now());

    expect(result).toBeOk();
    if (result.ok) {
      expect(result.data.data).toHaveLength(3);
      expect(result.data.total).toBe(3);
      expect(result.data.data[0].id).toBe(instance1.id);
    }
  });

  it('should pass all parameters to repository', async () => {
    const identityId = anIdentityId();
    const startDate = 1000;
    const endDate = 2000;

    await useCase.execute(identityId, startDate, endDate);

    expect(instanceRepo.findByDateRange).toHaveBeenCalledWith(identityId, startDate, endDate);
  });
});
