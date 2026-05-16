import { describe, it, expect, vi, beforeEach } from 'vitest';
import '@dailyuse/test-utils/helpers/result-matchers';
import { createMockRepo } from '@dailyuse/test-utils/mocks';
import { aOneTimeTask, aTaskInstance } from '@dailyuse/task/testing';
import type { ITaskTemplateRepository } from '@/domain-server/repositories/ITaskTemplateRepository';
import type { ITaskInstanceRepository } from '@/domain-server/repositories/ITaskInstanceRepository';
import { GetTaskTemplateUseCase } from '../get-task-template.use-case';

describe('GetTaskTemplateUseCase', () => {
  let templateRepo: ReturnType<typeof createMockRepo<ITaskTemplateRepository>>;
  let instanceRepo: ReturnType<typeof createMockRepo<ITaskInstanceRepository>>;
  let useCase: GetTaskTemplateUseCase;

  beforeEach(() => {
    vi.clearAllMocks();
    templateRepo = createMockRepo<ITaskTemplateRepository>({
      findById: vi.fn(),
      findByIdWithChildren: vi.fn(),
    });
    instanceRepo = createMockRepo<ITaskInstanceRepository>({
      findByTemplateId: vi.fn(),
    });
    vi.mocked(instanceRepo.findByTemplateId).mockResolvedValue([]);
    useCase = new GetTaskTemplateUseCase(templateRepo, instanceRepo);
  });

  it('should return null when template does not exist', async () => {
    vi.mocked(templateRepo.findById).mockResolvedValue(null);

    const result = await useCase.execute('non-existent');

    expect(result).toBeOk();
    if (result.ok) {
      expect(result.data).toBeNull();
    }
  });

  it('should return the template client DTO when found', async () => {
    const template = aOneTimeTask({ title: 'My Task' });
    vi.mocked(templateRepo.findById).mockResolvedValue(template);

    const result = await useCase.execute(template.id);

    expect(result).toBeOk();
    if (result.ok) {
      expect(result.data).toBeDefined();
      expect(result.data!.name).toBe('My Task');
      expect(result.data!.id).toBe(template.id);
    }
  });

  it('should hydrate stats from instances when includeChildren is false', async () => {
    const template = aOneTimeTask({ title: 'My Task' });
    const pendingInstance = await aTaskInstance({ templateId: template.id as any });
    const completedInstance = await aTaskInstance({ templateId: template.id as any });
    completedInstance.complete();

    vi.mocked(templateRepo.findById).mockResolvedValue(template);
    vi.mocked(instanceRepo.findByTemplateId).mockResolvedValue([
      pendingInstance,
      completedInstance,
    ]);

    const result = await useCase.execute(template.id);

    expect(result).toBeOk();
    if (result.ok && result.data) {
      expect(result.data.instanceCount).toBe(2);
      expect(result.data.completedInstanceCount).toBe(1);
      expect(result.data.completionRate).toBe(50);
    }
  });

  it('should use findById when includeChildren is false (default)', async () => {
    const template = aOneTimeTask();
    vi.mocked(templateRepo.findById).mockResolvedValue(template);

    await useCase.execute(template.id);

    expect(templateRepo.findById).toHaveBeenCalledWith(template.id);
    expect(templateRepo.findByIdWithChildren).not.toHaveBeenCalled();
  });

  it('should use findByIdWithChildren when includeChildren is true', async () => {
    const template = aOneTimeTask();
    vi.mocked(templateRepo.findByIdWithChildren).mockResolvedValue(template);

    await useCase.execute(template.id, true);

    expect(templateRepo.findByIdWithChildren).toHaveBeenCalledWith(template.id);
    expect(templateRepo.findById).not.toHaveBeenCalled();
    expect(instanceRepo.findByTemplateId).not.toHaveBeenCalled();
  });

  it('should pass includeChildren to toClientDTO', async () => {
    const template = aOneTimeTask();
    const spy = vi.spyOn(template, 'toClientDTO');
    vi.mocked(templateRepo.findByIdWithChildren).mockResolvedValue(template);

    await useCase.execute(template.id, true);

    expect(spy).toHaveBeenCalledWith(true);
  });

  it('should call toClientDTO with false for default', async () => {
    const template = aOneTimeTask();
    const spy = vi.spyOn(template, 'toClientDTO');
    vi.mocked(templateRepo.findById).mockResolvedValue(template);

    await useCase.execute(template.id);

    expect(spy).toHaveBeenCalledWith(false);
  });
});
