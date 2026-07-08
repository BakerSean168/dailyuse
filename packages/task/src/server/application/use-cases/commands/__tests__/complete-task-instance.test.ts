import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import '@dailyuse/test-utils/helpers/result-matchers';
import { createMockRepo } from '@dailyuse/test-utils/mocks';
import { aTaskInstance } from '@/testing';
import type { ITaskInstanceRepository } from '@/server/domain/repositories/i-task-instance-repository';
import { CompleteTaskInstanceUseCase } from '../complete-task-instance.use-case';

describe('CompleteTaskInstanceUseCase', () => {
  let instanceRepo: ReturnType<typeof createMockRepo<ITaskInstanceRepository>>;
  let useCase: CompleteTaskInstanceUseCase;

  beforeEach(() => {
    vi.clearAllMocks();
    vi.spyOn(console, 'warn').mockImplementation(() => undefined);
    vi.spyOn(console, 'error').mockImplementation(() => undefined);
    instanceRepo = createMockRepo<ITaskInstanceRepository>({
      findById: vi.fn(),
      save: vi.fn().mockResolvedValue(undefined),
    });
    useCase = new CompleteTaskInstanceUseCase(instanceRepo);
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('should return NOT_FOUND when instance does not exist', async () => {
    vi.mocked(instanceRepo.findById).mockResolvedValue(null);

    const result = await useCase.execute('non-existent');

    expect(result).toBeErrorWithCode('NOT_FOUND');
    expect(instanceRepo.save).not.toHaveBeenCalled();
  });

  it('should return VALIDATION_ERROR when instance cannot be completed', async () => {
    // Create a completed instance
    const instance = await aTaskInstance();
    instance.start();
    instance.complete();
    vi.mocked(instanceRepo.findById).mockResolvedValue(instance);

    const result = await useCase.execute(instance.id);

    expect(result).toBeErrorWithCode('VALIDATION_ERROR');
    expect(instanceRepo.save).not.toHaveBeenCalled();
  });

  it('should complete a Pending instance', async () => {
    const instance = await aTaskInstance();
    vi.mocked(instanceRepo.findById).mockResolvedValue(instance);

    const result = await useCase.execute(instance.id);

    expect(result).toBeOk();
    expect(instance.status).toBe('Completed');
    expect(instanceRepo.save).toHaveBeenCalledWith(instance);
  });

  it('should complete an InProgress instance', async () => {
    const instance = await aTaskInstance();
    instance.start();
    vi.mocked(instanceRepo.findById).mockResolvedValue(instance);

    const result = await useCase.execute(instance.id);

    expect(result).toBeOk();
    expect(instance.status).toBe('Completed');
  });

  it('should pass duration, note, and rating to complete()', async () => {
    const instance = await aTaskInstance();
    const completeSpy = vi.spyOn(instance, 'complete');
    vi.mocked(instanceRepo.findById).mockResolvedValue(instance);

    await useCase.execute(instance.id, {
      duration: 45,
      note: 'Great work',
      rating: 5,
    });

    expect(completeSpy).toHaveBeenCalledWith(45, 'Great work', 5);
  });

  it('should return the instance client DTO in the response', async () => {
    const instance = await aTaskInstance();
    vi.mocked(instanceRepo.findById).mockResolvedValue(instance);

    const result = await useCase.execute(instance.id);

    expect(result).toBeOk();
    if (result.ok) {
      expect(result.data.instance).toBeDefined();
      expect(result.data.instance.id).toBe(instance.id);
    }
  });
});
