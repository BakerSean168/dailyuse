import { describe, it, expect, vi, beforeEach } from 'vitest';
import '@dailyuse/test-utils/helpers/result-matchers';
import { createMockRepo } from '@dailyuse/test-utils/mocks';
import { aTaskInstance, anIdentityId } from '../../../../../testing';
import type { ITaskInstanceRepository } from '../../../../domain/repositories/i-task-instance-repository';
import { ListTaskInstancesByStatusUseCase } from '../list-task-instances-by-status.use-case';

describe('ListTaskInstancesByStatusUseCase', () => {
  let instanceRepo: ReturnType<typeof createMockRepo<ITaskInstanceRepository>>;
  let useCase: ListTaskInstancesByStatusUseCase;

  beforeEach(() => {
    vi.clearAllMocks();
    instanceRepo = createMockRepo<ITaskInstanceRepository>({
      findByStatus: vi.fn().mockResolvedValue([]),
    });
    useCase = new ListTaskInstancesByStatusUseCase(instanceRepo);
  });

  it('should return empty array when no instances match', async () => {
    const result = await useCase.execute(anIdentityId(), 'Pending');

    expect(result).toBeOk();
    if (result.ok) {
      expect(result.data).toEqual([]);
    }
  });

  it('should return instance DTOs for matching status', async () => {
    const instance1 = await aTaskInstance();
    const instance2 = await aTaskInstance();
    vi.mocked(instanceRepo.findByStatus).mockResolvedValue([instance1, instance2]);

    const result = await useCase.execute(anIdentityId(), 'Pending');

    expect(result).toBeOk();
    if (result.ok) {
      expect(result.data).toHaveLength(2);
      expect(result.data[0].id).toBe(instance1.id);
      expect(result.data[1].id).toBe(instance2.id);
    }
  });

  it('should pass identityId and status to repository', async () => {
    const identityId = anIdentityId();

    await useCase.execute(identityId, 'Completed');

    expect(instanceRepo.findByStatus).toHaveBeenCalledWith(identityId, 'Completed');
  });
});
