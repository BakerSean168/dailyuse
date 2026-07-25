import { describe, it, expect, vi, beforeEach } from 'vitest';
import '@dailyuse/test-utils/helpers/result-matchers';
import { createMockRepo } from '@dailyuse/test-utils/mocks';
import { aTaskInstance, aTaskTemplateId, aOneTimeTask } from '@/testing';
import type { ITaskInstanceRepository } from '@/server/domain/repositories/i-task-instance-repository';
import type { ITaskTemplateRepository } from '@/server/domain/repositories/i-task-template-repository';
import { ListTaskInstancesByTemplateUseCase } from '../list-task-instances-by-template.use-case';

describe('ListTaskInstancesByTemplateUseCase', () => {
  let instanceRepo: ReturnType<typeof createMockRepo<ITaskInstanceRepository>>;
  let templateRepo: ReturnType<typeof createMockRepo<ITaskTemplateRepository>>;
  let useCase: ListTaskInstancesByTemplateUseCase;

  beforeEach(() => {
    vi.clearAllMocks();
    instanceRepo = createMockRepo<ITaskInstanceRepository>({
      findByTemplateId: vi.fn().mockResolvedValue([]),
    });
    templateRepo = createMockRepo<ITaskTemplateRepository>({
      findByIdForIdentity: vi.fn(),
    });
    useCase = new ListTaskInstancesByTemplateUseCase(instanceRepo, templateRepo);
  });

  it('should return empty array when template is not owned', async () => {
    vi.mocked(templateRepo.findByIdForIdentity).mockResolvedValue(null);

    const result = await useCase.execute('template-1', 'identity-1');

    expect(result).toBeOk();
    if (result.ok) {
      expect(result.data).toEqual([]);
    }
    expect(instanceRepo.findByTemplateId).not.toHaveBeenCalled();
  });

  it('should return empty array when no instances exist for template', async () => {
    const template = aOneTimeTask();
    vi.mocked(templateRepo.findByIdForIdentity).mockResolvedValue(template);

    const result = await useCase.execute(template.id, template.identityId);

    expect(result).toBeOk();
    if (result.ok) {
      expect(result.data).toEqual([]);
    }
  });

  it('should return all instances for the template', async () => {
    const template = aOneTimeTask();
    const instance1 = await aTaskInstance({ templateId: template.id as any });
    const instance2 = await aTaskInstance({ templateId: template.id as any });
    vi.mocked(templateRepo.findByIdForIdentity).mockResolvedValue(template);
    vi.mocked(instanceRepo.findByTemplateId).mockResolvedValue([instance1, instance2]);

    const result = await useCase.execute(template.id, template.identityId);

    expect(result).toBeOk();
    if (result.ok) {
      expect(result.data).toHaveLength(2);
      expect(result.data[0].id).toBe(instance1.id);
      expect(result.data[1].id).toBe(instance2.id);
    }
  });

  it('should pass identity and templateId to ownership lookup', async () => {
    const template = aOneTimeTask();
    vi.mocked(templateRepo.findByIdForIdentity).mockResolvedValue(template);

    await useCase.execute(template.id, template.identityId);

    expect(templateRepo.findByIdForIdentity).toHaveBeenCalledWith(template.identityId, template.id);
    expect(instanceRepo.findByTemplateId).toHaveBeenCalledWith(template.id, template.identityId);
  });
});
