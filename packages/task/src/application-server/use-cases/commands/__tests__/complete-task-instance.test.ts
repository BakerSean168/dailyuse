import { describe, it, expect, vi, beforeEach } from 'vitest';
import '@dailyuse/test-utils/helpers/result-matchers';
import { createMockRepo } from '@dailyuse/test-utils/mocks';
import { aTaskInstance } from '@dailyuse/test-utils/fixtures';
import { aOneTimeTask, aLoadedTaskTemplate } from '@dailyuse/test-utils/fixtures';
import type { ITaskInstanceRepository } from '@/domain-server/repositories/ITaskInstanceRepository';
import type { ITaskTemplateRepository } from '@/domain-server/repositories/ITaskTemplateRepository';
import { CompleteTaskInstance } from '../complete-task-instance';

// Mock eventBus — preserve all real exports (e.g. createIdType) while replacing eventBus
vi.mock('@dailyuse/utils', async (importOriginal) => {
  const actual = await importOriginal<typeof import('@dailyuse/utils')>();
  return {
    ...actual,
    eventBus: { send: vi.fn() },
  };
});

import { eventBus } from '@dailyuse/utils';

describe('CompleteTaskInstance', () => {
  let instanceRepo: ReturnType<typeof createMockRepo<ITaskInstanceRepository>>;
  let templateRepo: ReturnType<typeof createMockRepo<ITaskTemplateRepository>>;
  let useCase: CompleteTaskInstance;

  beforeEach(() => {
    vi.clearAllMocks();
    instanceRepo = createMockRepo<ITaskInstanceRepository>({
      findById: vi.fn(),
      save: vi.fn().mockResolvedValue(undefined),
    });
    templateRepo = createMockRepo<ITaskTemplateRepository>({
      findById: vi.fn(),
    });
    useCase = new CompleteTaskInstance(instanceRepo, templateRepo);
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
    vi.mocked(templateRepo.findById).mockResolvedValue(aOneTimeTask());

    const result = await useCase.execute(instance.id);

    expect(result).toBeOk();
    expect(instance.status).toBe('Completed');
    expect(instanceRepo.save).toHaveBeenCalledWith(instance);
  });

  it('should complete an InProgress instance', async () => {
    const instance = await aTaskInstance();
    instance.start();
    vi.mocked(instanceRepo.findById).mockResolvedValue(instance);
    vi.mocked(templateRepo.findById).mockResolvedValue(aOneTimeTask());

    const result = await useCase.execute(instance.id);

    expect(result).toBeOk();
    expect(instance.status).toBe('Completed');
  });

  it('should pass duration, note, and rating to complete()', async () => {
    const instance = await aTaskInstance();
    const completeSpy = vi.spyOn(instance, 'complete');
    vi.mocked(instanceRepo.findById).mockResolvedValue(instance);
    vi.mocked(templateRepo.findById).mockResolvedValue(aOneTimeTask());

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
    vi.mocked(templateRepo.findById).mockResolvedValue(aOneTimeTask());

    const result = await useCase.execute(instance.id);

    expect(result).toBeOk();
    if (result.ok) {
      expect(result.data.instance).toBeDefined();
      expect(result.data.instance.id).toBe(instance.id);
    }
  });

  describe('event publishing', () => {
    it('should publish task.instance.completed event', async () => {
      const template = aOneTimeTask({ title: 'My Task' });
      const instance = await aTaskInstance({ templateId: template.id as any });
      vi.mocked(instanceRepo.findById).mockResolvedValue(instance);
      vi.mocked(templateRepo.findById).mockResolvedValue(template);

      await useCase.execute(instance.id);

      expect(eventBus.send).toHaveBeenCalledWith(
        'task.instance.completed',
        expect.objectContaining({
          taskInstanceId: instance.id,
          taskTemplateId: instance.templateId,
          title: template.title,
          identityId: instance.identityId,
        }),
      );
    });

    it('should include goalBinding when template has one', async () => {
      const template = aLoadedTaskTemplate({
        goalBinding: {
          goalId: 'goal-1',
          keyResultId: 'kr-1',
          goalRecordValue: 10,
        },
      });
      const instance = await aTaskInstance({ templateId: template.id as any });
      vi.mocked(instanceRepo.findById).mockResolvedValue(instance);
      vi.mocked(templateRepo.findById).mockResolvedValue(template);

      await useCase.execute(instance.id);

      expect(eventBus.send).toHaveBeenCalledWith(
        'task.instance.completed',
        expect.objectContaining({
          goalBinding: {
            goalId: 'goal-1',
            keyResultId: 'kr-1',
            incrementValue: 10,
          },
        }),
      );
    });

    it('should not fail if template is not found for event', async () => {
      const instance = await aTaskInstance();
      vi.mocked(instanceRepo.findById).mockResolvedValue(instance);
      vi.mocked(templateRepo.findById).mockResolvedValue(null);

      const result = await useCase.execute(instance.id);

      // The command itself should still succeed
      expect(result).toBeOk();
    });

    it('should not fail if event publishing throws', async () => {
      const instance = await aTaskInstance();
      vi.mocked(instanceRepo.findById).mockResolvedValue(instance);
      vi.mocked(templateRepo.findById).mockRejectedValue(new Error('Network error'));

      const result = await useCase.execute(instance.id);

      // Event publishing is fire-and-forget
      expect(result).toBeOk();
    });
  });
});
