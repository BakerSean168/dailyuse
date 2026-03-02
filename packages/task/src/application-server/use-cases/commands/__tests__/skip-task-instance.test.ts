import { describe, it, expect, vi, beforeEach } from 'vitest';
import '@dailyuse/test-utils/helpers/result-matchers';
import { createMockRepo } from '@dailyuse/test-utils/mocks';
import { aTaskInstance } from '@dailyuse/test-utils/fixtures';
import type { ITaskInstanceRepository } from '@/domain-server/repositories/ITaskInstanceRepository';
import { SkipTaskInstance } from '../skip-task-instance';

describe('SkipTaskInstance', () => {
  let instanceRepo: ReturnType<typeof createMockRepo<ITaskInstanceRepository>>;
  let useCase: SkipTaskInstance;

  beforeEach(() => {
    instanceRepo = createMockRepo<ITaskInstanceRepository>({
      findById: vi.fn(),
      save: vi.fn().mockResolvedValue(undefined),
    });
    useCase = new SkipTaskInstance(instanceRepo);
  });

  it('should return NOT_FOUND when instance does not exist', async () => {
    vi.mocked(instanceRepo.findById).mockResolvedValue(null);

    const result = await useCase.execute('non-existent');

    expect(result).toBeErrorWithCode('NOT_FOUND');
    expect(instanceRepo.save).not.toHaveBeenCalled();
  });

  it('should skip a Pending instance without a reason', async () => {
    const instance = await aTaskInstance();
    vi.mocked(instanceRepo.findById).mockResolvedValue(instance);

    const result = await useCase.execute(instance.id);

    expect(result).toBeOk();
    expect(instanceRepo.save).toHaveBeenCalledWith(instance);
    expect(instance.status).toBe('Skipped');
  });

  it('should skip a Pending instance with a reason', async () => {
    const instance = await aTaskInstance();
    vi.mocked(instanceRepo.findById).mockResolvedValue(instance);

    const result = await useCase.execute(instance.id, { reason: 'Not today' });

    expect(result).toBeOk();
    expect(instance.status).toBe('Skipped');
  });

  it('should skip an InProgress instance', async () => {
    const instance = await aTaskInstance();
    instance.start();
    vi.mocked(instanceRepo.findById).mockResolvedValue(instance);

    const result = await useCase.execute(instance.id, { reason: 'Changed plans' });

    expect(result).toBeOk();
    expect(instance.status).toBe('Skipped');
  });

  it('should return VALIDATION_ERROR when instance cannot be skipped', async () => {
    const instance = await aTaskInstance();
    instance.start();
    instance.complete();
    vi.mocked(instanceRepo.findById).mockResolvedValue(instance);

    const result = await useCase.execute(instance.id);

    expect(result).toBeErrorWithCode('VALIDATION_ERROR');
    expect(instanceRepo.save).not.toHaveBeenCalled();
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
