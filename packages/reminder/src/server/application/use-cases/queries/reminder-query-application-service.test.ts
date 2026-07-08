import { describe, expect, it, vi } from 'vitest';
import { ReminderQueryApplicationServiceUseCase } from './reminder-query-application-service.use-case';

describe('ReminderQueryApplicationServiceUseCase', () => {
  it('returns upcoming reminders as client dto list', async () => {
    const repository = {
      findByIdentityId: vi.fn().mockResolvedValue([
        { toClientDTO: vi.fn().mockReturnValue({ id: 't1' }) },
        { toClientDTO: vi.fn().mockReturnValue({ id: 't2' }) },
      ]),
    } as any;

    const useCase = new ReminderQueryApplicationServiceUseCase(repository);
    const result = await useCase.getUpcomingReminders({ identityId: 'identity-1' });

    expect(repository.findByIdentityId).toHaveBeenCalledWith('identity-1');
    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.data).toEqual([{ id: 't1' }, { id: 't2' }]);
    }
  });
});
