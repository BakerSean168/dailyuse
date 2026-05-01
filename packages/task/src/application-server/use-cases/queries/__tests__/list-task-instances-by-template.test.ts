import { describe, it, expect, vi, beforeEach } from 'vitest';
import '@dailyuse/test-utils/helpers/result-matchers';
import { createMockRepo } from '@dailyuse/test-utils/mocks';
import { aTaskInstance, aTaskTemplateId } from '@dailyuse/task/testing';
import type { ITaskInstanceRepository } from '@/domain-server/repositories/ITaskInstanceRepository';
import { ListTaskInstancesByTemplate } from '../list-task-instances-by-template';

describe('ListTaskInstancesByTemplate', () => {
  let instanceRepo: ReturnType<typeof createMockRepo<ITaskInstanceRepository>>;
  let useCase: ListTaskInstancesByTemplate;

  beforeEach(() => {
    vi.clearAllMocks();
    instanceRepo = createMockRepo<ITaskInstanceRepository>({
      findByTemplateId: vi.fn().mockResolvedValue([]),
    });
    useCase = new ListTaskInstancesByTemplate(instanceRepo);
  });

  it('should return empty array when no instances exist for template', async () => {
    const result = await useCase.execute('template-1');

    expect(result).toBeOk();
    if (result.ok) {
      expect(result.data).toEqual([]);
    }
  });

  it('should return all instances for the template', async () => {
    const templateId = aTaskTemplateId();
    const instance1 = await aTaskInstance({ templateId });
    const instance2 = await aTaskInstance({ templateId });
    vi.mocked(instanceRepo.findByTemplateId).mockResolvedValue([instance1, instance2]);

    const result = await useCase.execute(templateId);

    expect(result).toBeOk();
    if (result.ok) {
      expect(result.data).toHaveLength(2);
      expect(result.data[0].id).toBe(instance1.id);
      expect(result.data[1].id).toBe(instance2.id);
    }
  });

  it('should pass templateId to repository', async () => {
    const templateId = 'my-template-id';

    await useCase.execute(templateId);

    expect(instanceRepo.findByTemplateId).toHaveBeenCalledWith(templateId);
  });
});
