import { describe, expect, it, vi } from 'vitest';
import { GetReminderTemplateUseCase } from './get-reminder-template.use-case';

describe('GetReminderTemplateUseCase', () => {
  it('returns NOT_FOUND when template does not exist', async () => {
    const repository = {
      findById: vi.fn().mockResolvedValue(null),
    } as any;
    const useCase = new GetReminderTemplateUseCase(repository);

    const result = await useCase.execute('tpl-1');

    expect(repository.findById).toHaveBeenCalledWith('tpl-1');
    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.error.code).toBe('NOT_FOUND');
    }
  });

  it('returns client dto when template exists', async () => {
    const toClientDTO = vi.fn().mockReturnValue({ id: 'tpl-1', name: 'demo' });
    const repository = {
      findById: vi.fn().mockResolvedValue({ toClientDTO }),
    } as any;
    const useCase = new GetReminderTemplateUseCase(repository);

    const result = await useCase.execute('tpl-1');

    expect(toClientDTO).toHaveBeenCalledTimes(1);
    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.data).toEqual({ id: 'tpl-1', name: 'demo' });
    }
  });
});
