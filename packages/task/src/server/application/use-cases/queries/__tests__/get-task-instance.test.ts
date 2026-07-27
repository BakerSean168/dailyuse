import { describe, it, expect, vi, beforeEach } from 'vitest';
import '@dailyuse/test-utils/helpers/result-matchers';
import { createMockRepo } from '@dailyuse/test-utils/mocks';
import { aTaskInstance } from '../../../../../testing';
import type { ITaskInstanceRepository } from '../../../../domain/repositories/i-task-instance-repository';
import { GetTaskInstanceUseCase } from '../get-task-instance.use-case';

describe('GetTaskInstanceUseCase', () => {
  let instanceRepo: ReturnType<typeof createMockRepo<ITaskInstanceRepository>>;
  let useCase: GetTaskInstanceUseCase;

  beforeEach(() => {
    vi.clearAllMocks();
    instanceRepo = createMockRepo<ITaskInstanceRepository>({
      findByIdForIdentity: vi.fn(),
    });
    useCase = new GetTaskInstanceUseCase(instanceRepo);
  });

  it('should return null when instance does not exist', async () => {
    vi.mocked(instanceRepo.findByIdForIdentity).mockResolvedValue(null);

    const result = await useCase.execute('non-existent', 'identity-1');

    expect(result).toBeOk();
    if (result.ok) {
      expect(result.data).toBeNull();
    }
  });

  it('should return the instance client DTO when found', async () => {
    const instance = await aTaskInstance();
    vi.mocked(instanceRepo.findByIdForIdentity).mockResolvedValue(instance);

    const result = await useCase.execute(instance.id, instance.identityId);

    expect(result).toBeOk();
    if (result.ok) {
      expect(result.data).toBeDefined();
      expect(result.data!.id).toBe(instance.id);
    }
  });

  it('should call findByIdForIdentity with identity and id', async () => {
    vi.mocked(instanceRepo.findByIdForIdentity).mockResolvedValue(null);

    await useCase.execute('some-id', 'identity-1');

    expect(instanceRepo.findByIdForIdentity).toHaveBeenCalledWith('identity-1', 'some-id');
  });
});
