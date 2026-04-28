import { describe, expect, it, vi } from 'vitest';
import { GetReminderTemplate } from './get-reminder-template';

describe('GetReminderTemplate', () => {
  it('returns null when template does not exist', async () => {
    const repository = {
      findById: vi.fn().mockResolvedValue(null),
    } as any;
    const useCase = new GetReminderTemplate(repository);

    const result = await useCase.execute('tpl-1');

    expect(repository.findById).toHaveBeenCalledWith('tpl-1');
    expect(result).toBeNull();
  });

  it('returns client dto when template exists', async () => {
    const toClientDTO = vi.fn().mockReturnValue({ id: 'tpl-1', name: 'demo' });
    const repository = {
      findById: vi.fn().mockResolvedValue({ toClientDTO }),
    } as any;
    const useCase = new GetReminderTemplate(repository);

    const result = await useCase.execute('tpl-1');

    expect(toClientDTO).toHaveBeenCalledTimes(1);
    expect(result).toEqual({ id: 'tpl-1', name: 'demo' });
  });
});
