import { describe, expect, it, vi } from 'vitest';
import { ReminderQueryApplicationService } from './reminder-query-application-service';

describe('ReminderQueryApplicationService', () => {
  it('returns upcoming reminders as client dto list', async () => {
    const repository = {
      findByIdentityId: vi.fn().mockResolvedValue([
        { toClientDTO: vi.fn().mockReturnValue({ id: 't1' }) },
        { toClientDTO: vi.fn().mockReturnValue({ id: 't2' }) },
      ]),
    } as any;

    const service = new ReminderQueryApplicationService(repository);
    const result = await service.getUpcomingReminders('identity-1');

    expect(repository.findByIdentityId).toHaveBeenCalledWith('identity-1');
    expect(result).toEqual([{ id: 't1' }, { id: 't2' }]);
  });
});
