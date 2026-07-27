import { describe, it, expect, vi, beforeEach } from 'vitest';
import '@dailyuse/test-utils/helpers/result-matchers';
import { createMockRepo } from '@dailyuse/test-utils/mocks';
import { aOneTimeTask, aLoadedTaskTemplate } from '../../../../../testing';
import type { ITaskTemplateRepository } from '../../../../domain/repositories/i-task-template-repository';
import { UpdateTaskTemplateUseCase } from '../update-task-template.use-case';
import { ImportanceLevel } from '@dailyuse/contracts/shared';

describe('UpdateTaskTemplateUseCase', () => {
  let templateRepo: ReturnType<typeof createMockRepo<ITaskTemplateRepository>>;
  let useCase: UpdateTaskTemplateUseCase;

  beforeEach(() => {
    templateRepo = createMockRepo<ITaskTemplateRepository>({
      findByIdForIdentity: vi.fn(),
      save: vi.fn().mockResolvedValue(undefined),
    });
    useCase = new UpdateTaskTemplateUseCase(templateRepo);
  });

  it('should return NOT_FOUND when template does not exist', async () => {
    vi.mocked(templateRepo.findByIdForIdentity).mockResolvedValue(null);

    const result = await useCase.execute('non-existent', 'identity-1', { name: 'New Name' });

    expect(result).toBeErrorWithCode('NOT_FOUND');
    expect(templateRepo.save).not.toHaveBeenCalled();
  });

  it('should update the title when name is provided', async () => {
    const template = aOneTimeTask({ title: 'Old Name' });
    vi.mocked(templateRepo.findByIdForIdentity).mockResolvedValue(template);

    const result = await useCase.execute(template.id, template.identityId, { name: 'New Name' });

    expect(result).toBeOk();
    expect(template.title).toBe('New Name');
    expect(templateRepo.save).toHaveBeenCalledWith(template);
  });

  it('should update the description', async () => {
    const template = aOneTimeTask();
    vi.mocked(templateRepo.findByIdForIdentity).mockResolvedValue(template);

    const result = await useCase.execute(template.id, template.identityId, {
      description: 'Updated description',
    });

    expect(result).toBeOk();
    expect(template.description).toBe('Updated description');
  });

  it('should clear the description when null is passed', async () => {
    const template = aLoadedTaskTemplate({ description: 'Some description' });
    vi.mocked(templateRepo.findByIdForIdentity).mockResolvedValue(template);

    const result = await useCase.execute(template.id, template.identityId, { description: null as any });

    expect(result).toBeOk();
    expect(template.description).toBeNull();
  });

  it('should update importance', async () => {
    const template = aOneTimeTask({ importance: ImportanceLevel.Moderate });
    vi.mocked(templateRepo.findByIdForIdentity).mockResolvedValue(template);

    const result = await useCase.execute(template.id, template.identityId, {
      importance: ImportanceLevel.Vital,
    });

    expect(result).toBeOk();
    expect(template.importance).toBe(ImportanceLevel.Vital);
  });

  it('should update tags', async () => {
    const template = aOneTimeTask({ tags: ['old-tag'] });
    vi.mocked(templateRepo.findByIdForIdentity).mockResolvedValue(template);

    const result = await useCase.execute(template.id, template.identityId, {
      tags: ['new-tag-1', 'new-tag-2'],
    });

    expect(result).toBeOk();
    expect(template.tags).toEqual(['new-tag-1', 'new-tag-2']);
  });

  it('should update color', async () => {
    const template = aOneTimeTask();
    vi.mocked(templateRepo.findByIdForIdentity).mockResolvedValue(template);

    const result = await useCase.execute(template.id, template.identityId, { color: '#FF0000' });

    expect(result).toBeOk();
    expect(template.color).toBe('#FF0000');
  });

  it('should clear color when null is passed', async () => {
    const template = aLoadedTaskTemplate({ color: '#FF0000' });
    vi.mocked(templateRepo.findByIdForIdentity).mockResolvedValue(template);

    const result = await useCase.execute(template.id, template.identityId, { color: null as any });

    expect(result).toBeOk();
    expect(template.color).toBeNull();
  });

  it('should update multiple fields at once', async () => {
    const template = aOneTimeTask({ title: 'Old', importance: ImportanceLevel.Minor });
    vi.mocked(templateRepo.findByIdForIdentity).mockResolvedValue(template);

    const result = await useCase.execute(template.id, template.identityId, {
      name: 'New Name',
      importance: ImportanceLevel.Vital,
      tags: ['urgent'],
      color: '#00FF00',
    });

    expect(result).toBeOk();
    expect(template.title).toBe('New Name');
    expect(template.importance).toBe(ImportanceLevel.Vital);
    expect(template.tags).toEqual(['urgent']);
    expect(template.color).toBe('#00FF00');
  });

  it('should not modify fields that are not in the request', async () => {
    const template = aOneTimeTask({
      title: 'Keep Me',
      importance: ImportanceLevel.Important,
      tags: ['keep'],
    });
    vi.mocked(templateRepo.findByIdForIdentity).mockResolvedValue(template);

    // Only update color
    const result = await useCase.execute(template.id, template.identityId, { color: '#000' });

    expect(result).toBeOk();
    expect(template.title).toBe('Keep Me');
    expect(template.importance).toBe(ImportanceLevel.Important);
    expect(template.tags).toEqual(['keep']);
  });

  it('should save exactly once', async () => {
    const template = aOneTimeTask();
    vi.mocked(templateRepo.findByIdForIdentity).mockResolvedValue(template);

    await useCase.execute(template.id, template.identityId, {
      name: 'A',
      description: 'B',
      importance: ImportanceLevel.Vital,
    });

    expect(templateRepo.save).toHaveBeenCalledTimes(1);
  });

  it('should return the updated client DTO', async () => {
    const template = aOneTimeTask({ title: 'Before' });
    vi.mocked(templateRepo.findByIdForIdentity).mockResolvedValue(template);

    const result = await useCase.execute(template.id, template.identityId, { name: 'After' });

    expect(result).toBeOk();
    if (result.ok) {
      expect(result.data.name).toBe('After');
    }
  });

  it('should treat clearing a missing goal binding as a no-op', async () => {
    const template = aOneTimeTask({ title: 'No Goal Binding' });
    vi.mocked(templateRepo.findByIdForIdentity).mockResolvedValue(template);

    const result = await useCase.execute(template.id, template.identityId, { goalBinding: null });

    expect(result).toBeOk();
    expect(template.goalBinding).toBeNull();
    expect(templateRepo.save).toHaveBeenCalledWith(template);
  });
});
