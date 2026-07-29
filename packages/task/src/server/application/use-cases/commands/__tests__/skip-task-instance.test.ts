import { describe, it, expect, vi, beforeEach } from 'vitest';
import '@memoflow/test-utils/helpers/result-matchers';
import { createMockRepo } from '@memoflow/test-utils/mocks';
import { aTaskInstance } from '../../../../../testing';
import type { ITaskInstanceRepository } from '../../../../domain/repositories/i-task-instance-repository';
import { SkipTaskInstanceUseCase } from '../skip-task-instance.use-case';

describe('SkipTaskInstanceUseCase', () => {
  let instanceRepo: ReturnType<typeof createMockRepo<ITaskInstanceRepository>>;
  let useCase: SkipTaskInstanceUseCase;

  beforeEach(() => {
    instanceRepo = createMockRepo<ITaskInstanceRepository>({
      findByIdForIdentity: vi.fn(),
      save: vi.fn().mockResolvedValue(undefined),
    });
    useCase = new SkipTaskInstanceUseCase(instanceRepo);
  });

  it('should return NOT_FOUND when instance does not exist', async () => {
    vi.mocked(instanceRepo.findByIdForIdentity).mockResolvedValue(null);

    const result = await useCase.execute('non-existent', 'identity-1');

    expect(result).toBeErrorWithCode('NOT_FOUND');
    expect(instanceRepo.save).not.toHaveBeenCalled();
  });

  it('should skip a Pending instance without a reason', async () => {
    const instance = await aTaskInstance();
    vi.mocked(instanceRepo.findByIdForIdentity).mockResolvedValue(instance);

    const result = await useCase.execute(instance.id, instance.identityId);

    expect(result).toBeOk();
    expect(instanceRepo.save).toHaveBeenCalledWith(instance);
    expect(instance.status).toBe('Skipped');
  });

  it('should skip a Pending instance with a reason', async () => {
    const instance = await aTaskInstance();
    vi.mocked(instanceRepo.findByIdForIdentity).mockResolvedValue(instance);

    const result = await useCase.execute(instance.id, instance.identityId, { reason: 'Not today' });

    expect(result).toBeOk();
    expect(instance.status).toBe('Skipped');
  });

  it('should skip an InProgress instance', async () => {
    const instance = await aTaskInstance();
    instance.start();
    vi.mocked(instanceRepo.findByIdForIdentity).mockResolvedValue(instance);

    const result = await useCase.execute(instance.id, instance.identityId, { reason: 'Changed plans' });

    expect(result).toBeOk();
    expect(instance.status).toBe('Skipped');
  });

  it('should return VALIDATION_ERROR when instance cannot be skipped', async () => {
    const instance = await aTaskInstance();
    instance.start();
    instance.complete();
    vi.mocked(instanceRepo.findByIdForIdentity).mockResolvedValue(instance);

    const result = await useCase.execute(instance.id, instance.identityId);

    expect(result).toBeErrorWithCode('VALIDATION_ERROR');
    expect(instanceRepo.save).not.toHaveBeenCalled();
  });

  it('should return the instance client DTO in the response', async () => {
    const instance = await aTaskInstance();
    vi.mocked(instanceRepo.findByIdForIdentity).mockResolvedValue(instance);

    const result = await useCase.execute(instance.id, instance.identityId);

    expect(result).toBeOk();
    if (result.ok) {
      expect(result.data.instance).toBeDefined();
      expect(result.data.instance.id).toBe(instance.id);
    }
  });
});
