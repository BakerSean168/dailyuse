import { beforeEach, describe, expect, it, vi } from 'vitest';
import { ListReminderTemplates } from './list-reminder-templates';

describe('ListReminderTemplates', () => {
  const repository = {
    findByGroupId: vi.fn(),
    findActive: vi.fn(),
    findByIdentityId: vi.fn(),
  } as any;

  const createTemplate = (id: string) => ({
    toClientDTO: vi.fn().mockReturnValue({ id }),
  });

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('queries by group id when group filter is provided', async () => {
    const t1 = createTemplate('t1');
    repository.findByGroupId.mockResolvedValue([t1]);
    const useCase = new ListReminderTemplates(repository);

    const result = await useCase.execute('identity-1', { groupId: 'group-1' });

    expect(repository.findByGroupId).toHaveBeenCalledWith('group-1', {
      includeHistory: false,
    });
    expect(repository.findActive).not.toHaveBeenCalled();
    expect(repository.findByIdentityId).not.toHaveBeenCalled();
    expect(result).toEqual({
      templates: [{ id: 't1' }],
      total: 1,
    });
  });

  it('queries active templates when effectiveEnabled is true', async () => {
    const t1 = createTemplate('t1');
    const t2 = createTemplate('t2');
    repository.findActive.mockResolvedValue([t1, t2]);
    const useCase = new ListReminderTemplates(repository);

    const result = await useCase.execute('identity-1', { effectiveEnabled: true });

    expect(repository.findActive).toHaveBeenCalledWith('identity-1');
    expect(repository.findByGroupId).not.toHaveBeenCalled();
    expect(repository.findByIdentityId).not.toHaveBeenCalled();
    expect(result.total).toBe(2);
    expect(result.templates).toEqual([{ id: 't1' }, { id: 't2' }]);
  });

  it('queries by identity by default', async () => {
    const t1 = createTemplate('t1');
    repository.findByIdentityId.mockResolvedValue([t1]);
    const useCase = new ListReminderTemplates(repository);

    const result = await useCase.execute('identity-1');

    expect(repository.findByIdentityId).toHaveBeenCalledWith('identity-1', {
      includeHistory: false,
    });
    expect(repository.findByGroupId).not.toHaveBeenCalled();
    expect(repository.findActive).not.toHaveBeenCalled();
    expect(result).toEqual({
      templates: [{ id: 't1' }],
      total: 1,
    });
  });
});
