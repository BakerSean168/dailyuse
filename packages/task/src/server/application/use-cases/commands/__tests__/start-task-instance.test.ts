import { describe, it, expect, vi, beforeEach } from 'vitest';
import '@dailyuse/test-utils/helpers/result-matchers';
import { createMockRepo } from '@dailyuse/test-utils/mocks';
import { aTaskInstance } from '@/testing';
import type { ITaskInstanceRepository } from '@/server/domain/repositories/i-task-instance-repository';
import { StartTaskInstanceUseCase } from '../start-task-instance.use-case';

describe('StartTaskInstanceUseCase', () => {
  let instanceRepo: ReturnType<typeof createMockRepo<ITaskInstanceRepository>>;
  let useCase: StartTaskInstanceUseCase;

  beforeEach(() => {
    instanceRepo = createMockRepo<ITaskInstanceRepository>({
      findById: vi.fn(),
      save: vi.fn().mockResolvedValue(undefined),
    });
    useCase = new StartTaskInstanceUseCase(instanceRepo);
  });

  it('should return NOT_FOUND when instance does not exist', async () => {
    vi.mocked(instanceRepo.findById).mockResolvedValue(null);

    const result = await useCase.execute('non-existent');

    expect(result).toBeErrorWithCode('NOT_FOUND');
    expect(instanceRepo.save).not.toHaveBeenCalled();
  });

  it('should start a Pending instance and return ok', async () => {
    const instance = await aTaskInstance();
    vi.mocked(instanceRepo.findById).mockResolvedValue(instance);

    const result = await useCase.execute(instance.id);

    expect(result).toBeOk();
    expect(instanceRepo.save).toHaveBeenCalledWith(instance);
    expect(instance.status).toBe('InProgress');
  });

  it('should return VALIDATION_ERROR when instance cannot be started', async () => {
    // Create and complete an instance so it can't be started
    const instance = await aTaskInstance();
    instance.start();
    instance.complete();
    vi.mocked(instanceRepo.findById).mockResolvedValue(instance);

    const result = await useCase.execute(instance.id);

    expect(result).toBeErrorWithCode('VALIDATION_ERROR');
    expect(instanceRepo.save).not.toHaveBeenCalled();
  });

  it('should return the instance client DTO on success', async () => {
    const instance = await aTaskInstance();
    vi.mocked(instanceRepo.findById).mockResolvedValue(instance);

    const result = await useCase.execute(instance.id);

    expect(result).toBeOk();
    if (result.ok) {
      expect(result.data).toEqual(instance.toClientDTO());
    }
  });
});
