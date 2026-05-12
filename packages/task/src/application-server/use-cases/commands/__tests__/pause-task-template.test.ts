import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import '@dailyuse/test-utils/helpers/result-matchers';
import { createMockRepo } from '@dailyuse/test-utils/mocks';
import { aLoadedTaskTemplate, aTaskInstance } from '@dailyuse/task/testing';
import type { ITaskTemplateRepository } from '@/domain-server/repositories/ITaskTemplateRepository';
import type { ITaskInstanceRepository } from '@/domain-server/repositories/ITaskInstanceRepository';
import { TaskTemplateStatus } from '@dailyuse/contracts/task';
import { PauseTaskTemplateUseCase } from '../pause-task-template.use-case';

describe('PauseTaskTemplateUseCase', () => {
  let templateRepo: ReturnType<typeof createMockRepo<ITaskTemplateRepository>>;
  let instanceRepo: ReturnType<typeof createMockRepo<ITaskInstanceRepository>>;
  let useCase: PauseTaskTemplateUseCase;

  beforeEach(() => {
    vi.clearAllMocks();
    vi.spyOn(console, 'error').mockImplementation(() => undefined);
    templateRepo = createMockRepo<ITaskTemplateRepository>({
      findById: vi.fn(),
      save: vi.fn().mockResolvedValue(undefined),
    });
    instanceRepo = createMockRepo<ITaskInstanceRepository>({
      deleteIncompleteInstancesFrom: vi.fn().mockResolvedValue(0),
    });
    useCase = new PauseTaskTemplateUseCase(templateRepo, instanceRepo);
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('should return NOT_FOUND when template does not exist', async () => {
    vi.mocked(templateRepo.findById).mockResolvedValue(null);

    const result = await useCase.execute('non-existent');

    expect(result).toBeErrorWithCode('NOT_FOUND');
    expect(templateRepo.save).not.toHaveBeenCalled();
  });

  it('should pause an active template', async () => {
    const template = aLoadedTaskTemplate({ status: TaskTemplateStatus.Active });
    vi.mocked(templateRepo.findById).mockResolvedValue(template);

    const result = await useCase.execute(template.id);

    expect(result).toBeOk();
    expect(template.status).toBe(TaskTemplateStatus.Paused);
    expect(templateRepo.save).toHaveBeenCalledWith(template);
  });

  it('should delete incomplete instances when pausing', async () => {
    const template = aLoadedTaskTemplate({ status: TaskTemplateStatus.Active });
    vi.mocked(templateRepo.findById).mockResolvedValue(template);
    vi.mocked(instanceRepo.deleteIncompleteInstancesFrom).mockResolvedValue(1);

    const result = await useCase.execute(template.id);

    expect(result).toBeOk();
    expect(instanceRepo.deleteIncompleteInstancesFrom).toHaveBeenCalledWith(
      template.id,
      expect.any(Number),
    );
  });

  it('should include the deleted instance count', async () => {
    const template = aLoadedTaskTemplate({ status: TaskTemplateStatus.Active });
    vi.mocked(templateRepo.findById).mockResolvedValue(template);
    vi.mocked(instanceRepo.deleteIncompleteInstancesFrom).mockResolvedValue(2);

    const result = await useCase.execute(template.id);

    expect(result).toBeOk();
    if (result.ok) {
      expect(result.data.instancesDeleted).toBe(2);
    }
  });

  it('should return 0 deleted instances when there are none', async () => {
    const template = aLoadedTaskTemplate({ status: TaskTemplateStatus.Active });
    vi.mocked(templateRepo.findById).mockResolvedValue(template);
    vi.mocked(instanceRepo.deleteIncompleteInstancesFrom).mockResolvedValue(0);

    const result = await useCase.execute(template.id);

    expect(result).toBeOk();
    if (result.ok) {
      expect(result.data.instancesDeleted).toBe(0);
    }
  });

  it('should return the template client DTO', async () => {
    const template = aLoadedTaskTemplate({
      status: TaskTemplateStatus.Active,
      title: 'My Paused Task',
    });
    vi.mocked(templateRepo.findById).mockResolvedValue(template);

    const result = await useCase.execute(template.id);

    expect(result).toBeOk();
    if (result.ok) {
      expect(result.data.template).toBeDefined();
      expect(result.data.template.name).toBe('My Paused Task');
    }
  });

  it('should handle instance processing errors gracefully', async () => {
    const template = aLoadedTaskTemplate({ status: TaskTemplateStatus.Active });
    vi.mocked(templateRepo.findById).mockResolvedValue(template);
    vi.mocked(instanceRepo.deleteIncompleteInstancesFrom).mockRejectedValue(new Error('DB error'));

    const result = await useCase.execute(template.id);

    // Pause itself should still succeed, delete errors are caught
    expect(result).toBeOk();
    if (result.ok) {
      expect(result.data.instancesDeleted).toBe(0);
    }
  });
});
