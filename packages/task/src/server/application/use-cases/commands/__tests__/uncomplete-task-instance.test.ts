import { beforeEach, describe, expect, it, vi } from 'vitest';
import '@memoflow/test-utils/helpers/result-matchers';
import { createMockRepo } from '@memoflow/test-utils/mocks';
import { aTaskInstance } from '../../../../../testing';
import type { ITaskInstanceRepository } from '../../../../domain/repositories/i-task-instance-repository';
import { UncompleteTaskInstanceUseCase } from '../uncomplete-task-instance.use-case';

describe('UncompleteTaskInstanceUseCase', () => {
  let instanceRepository: ReturnType<typeof createMockRepo<ITaskInstanceRepository>>;
  let useCase: UncompleteTaskInstanceUseCase;

  beforeEach(() => {
    instanceRepository = createMockRepo<ITaskInstanceRepository>({
      findByIdForIdentity: vi.fn(),
      save: vi.fn().mockResolvedValue(undefined),
    });
    useCase = new UncompleteTaskInstanceUseCase(instanceRepository);
  });

  it('returns a completed instance to Pending and saves it', async () => {
    const instance = await aTaskInstance();
    instance.complete();
    instance.pullDomainEvents();
    vi.mocked(instanceRepository.findByIdForIdentity).mockResolvedValue(instance);

    const result = await useCase.execute(String(instance.id), String(instance.identityId));

    expect(result).toBeOk();
    expect(instance.status).toBe('Pending');
    expect(instanceRepository.save).toHaveBeenCalledWith(instance);
  });

  it('rejects an instance that is not completed', async () => {
    const instance = await aTaskInstance();
    vi.mocked(instanceRepository.findByIdForIdentity).mockResolvedValue(instance);

    const result = await useCase.execute(String(instance.id), String(instance.identityId));

    expect(result).toBeErrorWithCode('VALIDATION_ERROR');
    expect(instanceRepository.save).not.toHaveBeenCalled();
  });
});
