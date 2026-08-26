import { describe, it, expect, vi, beforeEach } from 'vitest';
import '@memoflow/test-utils/helpers/result-matchers';
import { createMockRepo } from '@memoflow/test-utils/mocks';
import { aOneTimeTask, aLoadedTaskTemplate } from '../../../../../testing';
import type { ITaskTemplateRepository } from '../../../../domain/repositories/i-task-template-repository';
import { ArchiveTaskTemplateUseCase } from '../archive-task-template.use-case';
import { TaskTemplateStatus } from '@memoflow/contracts/task';

describe('ArchiveTaskTemplateUseCase', () => {
  let templateRepo: ReturnType<typeof createMockRepo<ITaskTemplateRepository>>;
  let useCase: ArchiveTaskTemplateUseCase;

  beforeEach(() => {
    templateRepo = createMockRepo<ITaskTemplateRepository>({
      findByIdForIdentity: vi.fn(),
      save: vi.fn().mockResolvedValue(undefined),
    });
    useCase = new ArchiveTaskTemplateUseCase(templateRepo);
  });

  it('should return NOT_FOUND when template does not exist', async () => {
    vi.mocked(templateRepo.findByIdForIdentity).mockResolvedValue(null);

    const result = await useCase.execute('non-existent', 'identity-1');

    expect(result).toBeErrorWithCode('NOT_FOUND');
    expect(templateRepo.save).not.toHaveBeenCalled();
  });

  it('should archive an active template', async () => {
    const template = aOneTimeTask({ title: 'Archive me' });
    vi.mocked(templateRepo.findByIdForIdentity).mockResolvedValue(template);

    const result = await useCase.execute(template.id, template.identityId);

    expect(result).toBeOk();
    expect(template.status).toBe(TaskTemplateStatus.Active);
    expect(template.archivedAt).not.toBeNull();
    expect(templateRepo.save).toHaveBeenCalledWith(template);
  });

  it('should archive a paused template', async () => {
    const template = aLoadedTaskTemplate({ status: TaskTemplateStatus.Paused });
    vi.mocked(templateRepo.findByIdForIdentity).mockResolvedValue(template);

    const result = await useCase.execute(template.id, template.identityId);

    expect(result).toBeOk();
    expect(template.status).toBe(TaskTemplateStatus.Paused);
    expect(template.archivedAt).not.toBeNull();
  });

  it('should return the client DTO on success', async () => {
    const template = aOneTimeTask({ title: 'My Task' });
    vi.mocked(templateRepo.findByIdForIdentity).mockResolvedValue(template);

    const result = await useCase.execute(template.id, template.identityId);

    expect(result).toBeOk();
    if (result.ok) {
      expect(result.data.name).toBe('My Task');
    }
  });
});
