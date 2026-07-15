import { describe, expect, it, vi } from 'vitest';
import { GetReminderTemplateUseCase } from './get-reminder-template.use-case';

describe('GetReminderTemplateUseCase', () => {
  const groupRepository = {
    findById: vi.fn(),
  } as any;
  const templateMapper = {
    toDTO: vi.fn(),
  } as any;

  it('returns NOT_FOUND when template does not exist', async () => {
    const repository = {
      findById: vi.fn().mockResolvedValue(null),
    } as any;
    const useCase = new GetReminderTemplateUseCase(repository, groupRepository, templateMapper);

    const result = await useCase.execute('tpl-1', { identityId: 'identity-1' });

    expect(repository.findById).toHaveBeenCalledWith('tpl-1', { includeHistory: true });
    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.error.code).toBe('NOT_FOUND');
    }
  });

  it('returns client dto when template exists', async () => {
    templateMapper.toDTO.mockResolvedValue({ id: 'tpl-1', name: 'demo' });
    const repository = {
      findById: vi.fn().mockResolvedValue({
        id: 'tpl-1',
        identityId: 'identity-1',
        groupId: null,
      }),
    } as any;
    const useCase = new GetReminderTemplateUseCase(repository, groupRepository, templateMapper);

    const result = await useCase.execute('tpl-1', { identityId: 'identity-1' });

    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.data).toEqual({ id: 'tpl-1', name: 'demo' });
    }
  });
});
