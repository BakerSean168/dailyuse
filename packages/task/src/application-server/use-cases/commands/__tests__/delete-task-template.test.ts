import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import '@dailyuse/test-utils/helpers/result-matchers';
import { createMockRepo } from '@dailyuse/test-utils/mocks';
import { aOneTimeTask } from '@dailyuse/test-utils/fixtures';
import type { ITaskTemplateRepository } from '@/domain-server/repositories/ITaskTemplateRepository';
import type { ITaskInstanceRepository } from '@/domain-server/repositories/ITaskInstanceRepository';
import { DeleteTaskTemplate } from '../delete-task-template';

describe('DeleteTaskTemplate', () => {
  let templateRepo: ReturnType<typeof createMockRepo<ITaskTemplateRepository>>;
  let instanceRepo: ReturnType<typeof createMockRepo<ITaskInstanceRepository>>;
  let useCase: DeleteTaskTemplate;

  beforeEach(() => {
    vi.clearAllMocks();
    vi.spyOn(console, 'error').mockImplementation(() => undefined);
    templateRepo = createMockRepo<ITaskTemplateRepository>({
      findById: vi.fn(),
      save: vi.fn().mockResolvedValue(undefined),
      delete: vi.fn().mockResolvedValue(undefined),
    });
    instanceRepo = createMockRepo<ITaskInstanceRepository>({
      deleteByTemplateId: vi.fn().mockResolvedValue(undefined),
    });
    useCase = new DeleteTaskTemplate(templateRepo, instanceRepo);
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('should return ok with success:true when template not found (idempotent)', async () => {
    vi.mocked(templateRepo.findById).mockResolvedValue(null);

    const result = await useCase.execute('non-existent');

    expect(result).toBeOk();
    if (result.ok) {
      expect(result.data.success).toBe(true);
    }
    expect(templateRepo.delete).not.toHaveBeenCalled();
    expect(templateRepo.save).not.toHaveBeenCalled();
    expect(instanceRepo.deleteByTemplateId).not.toHaveBeenCalled();
  });

  it('should hard-delete when soft=false (default)', async () => {
    const template = aOneTimeTask();
    vi.mocked(templateRepo.findById).mockResolvedValue(template);

    const result = await useCase.execute(template.id);

    expect(result).toBeOk();
    expect(templateRepo.save).toHaveBeenCalledWith(template);
    expect(instanceRepo.deleteByTemplateId).toHaveBeenCalledWith(template.id);
    expect(templateRepo.delete).toHaveBeenCalledWith(template.id);
  });

  it('should soft-delete when soft=true', async () => {
    const template = aOneTimeTask();
    vi.mocked(templateRepo.findById).mockResolvedValue(template);

    const result = await useCase.execute(template.id, true);

    expect(result).toBeOk();
    expect(templateRepo.save).toHaveBeenCalledWith(template);
    expect(instanceRepo.deleteByTemplateId).toHaveBeenCalledWith(template.id);
    expect(templateRepo.delete).not.toHaveBeenCalled();
  });

  it('should return success:true after delete', async () => {
    const template = aOneTimeTask();
    vi.mocked(templateRepo.findById).mockResolvedValue(template);

    const result = await useCase.execute(template.id);

    expect(result).toBeOkWith({ success: true });
  });
});
