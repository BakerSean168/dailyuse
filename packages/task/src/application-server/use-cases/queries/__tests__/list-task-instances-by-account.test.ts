import { describe, it, expect, vi, beforeEach } from 'vitest';
import '@dailyuse/test-utils/helpers/result-matchers';
import { createMockRepo } from '@dailyuse/test-utils/mocks';
import { aTaskInstance, anIdentityId } from '@dailyuse/task/testing';
import type { ITaskInstanceRepository } from '@/domain-server/repositories/ITaskInstanceRepository';
import { ListTaskInstancesByAccount } from '../list-task-instances-by-account';

describe('ListTaskInstancesByAccount', () => {
  let instanceRepo: ReturnType<typeof createMockRepo<ITaskInstanceRepository>>;
  let useCase: ListTaskInstancesByAccount;

  beforeEach(() => {
    vi.clearAllMocks();
    instanceRepo = createMockRepo<ITaskInstanceRepository>({
      findByIdentityId: vi.fn().mockResolvedValue([]),
    });
    useCase = new ListTaskInstancesByAccount(instanceRepo);
  });

  it('should return empty array when no instances exist', async () => {
    const result = await useCase.execute(anIdentityId());

    expect(result).toBeOk();
    if (result.ok) {
      expect(result.data).toEqual([]);
    }
  });

  it('should return all instances for the account', async () => {
    const instance1 = await aTaskInstance();
    const instance2 = await aTaskInstance();
    vi.mocked(instanceRepo.findByIdentityId).mockResolvedValue([instance1, instance2]);

    const result = await useCase.execute(anIdentityId());

    expect(result).toBeOk();
    if (result.ok) {
      expect(result.data).toHaveLength(2);
      expect(result.data[0].id).toBe(instance1.id);
    }
  });

  it('should pass identityId to repository', async () => {
    const identityId = anIdentityId();

    await useCase.execute(identityId);

    expect(instanceRepo.findByIdentityId).toHaveBeenCalledWith(identityId);
  });
});
