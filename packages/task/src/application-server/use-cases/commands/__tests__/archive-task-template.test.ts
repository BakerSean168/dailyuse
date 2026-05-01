import { describe, it, expect, vi, beforeEach } from 'vitest';
import '@dailyuse/test-utils/helpers/result-matchers';
import { createMockRepo } from '@dailyuse/test-utils/mocks';
import { aOneTimeTask, aLoadedTaskTemplate } from '@dailyuse/task/testing';
import type { ITaskTemplateRepository } from '@/domain-server/repositories/ITaskTemplateRepository';
import { ArchiveTaskTemplate } from '../archive-task-template';
import { TaskTemplateStatus } from '@dailyuse/contracts/task';

describe('ArchiveTaskTemplate', () => {
  let templateRepo: ReturnType<typeof createMockRepo<ITaskTemplateRepository>>;
  let useCase: ArchiveTaskTemplate;

  beforeEach(() => {
    templateRepo = createMockRepo<ITaskTemplateRepository>({
      findById: vi.fn(),
      save: vi.fn().mockResolvedValue(undefined),
    });
    useCase = new ArchiveTaskTemplate(templateRepo);
  });

  it('should return NOT_FOUND when template does not exist', async () => {
    vi.mocked(templateRepo.findById).mockResolvedValue(null);

    const result = await useCase.execute('non-existent');

    expect(result).toBeErrorWithCode('NOT_FOUND');
    expect(templateRepo.save).not.toHaveBeenCalled();
  });

  it('should archive an active template', async () => {
    const template = aOneTimeTask({ title: 'Archive me' });
    vi.mocked(templateRepo.findById).mockResolvedValue(template);

    const result = await useCase.execute(template.id);

    expect(result).toBeOk();
    expect(template.status).toBe(TaskTemplateStatus.Archived);
    expect(templateRepo.save).toHaveBeenCalledWith(template);
  });

  it('should archive a paused template', async () => {
    const template = aLoadedTaskTemplate({ status: TaskTemplateStatus.Paused });
    vi.mocked(templateRepo.findById).mockResolvedValue(template);

    const result = await useCase.execute(template.id);

    expect(result).toBeOk();
    expect(template.status).toBe(TaskTemplateStatus.Archived);
  });

  it('should return the client DTO on success', async () => {
    const template = aOneTimeTask({ title: 'My Task' });
    vi.mocked(templateRepo.findById).mockResolvedValue(template);

    const result = await useCase.execute(template.id);

    expect(result).toBeOk();
    if (result.ok) {
      expect(result.data.name).toBe('My Task');
    }
  });
});
