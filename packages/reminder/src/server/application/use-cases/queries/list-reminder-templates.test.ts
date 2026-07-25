import { beforeEach, describe, expect, it, vi } from 'vitest';
import { ListReminderTemplatesUseCase } from './list-reminder-templates.use-case';

describe('ListReminderTemplatesUseCase', () => {
  const repository = {
    findByGroupId: vi.fn(),
    findActive: vi.fn(),
    findByIdentityId: vi.fn(),
  } as any;
  const groupRepository = {
    findByIds: vi.fn(),
  } as any;
  const templateMapper = {
    toDTOList: vi.fn(),
  } as any;

  const createTemplate = (id: string) => ({
    id,
    identityId: 'identity-1',
    groupId: null,
  });

  beforeEach(() => {
    vi.clearAllMocks();
    templateMapper.toDTOList.mockImplementation(async (templates: Array<{ id: string }>) =>
      templates.map((template) => ({ id: template.id })),
    );
  });

  it('queries by group id when group filter is provided', async () => {
    const t1 = createTemplate('t1');
    repository.findByGroupId.mockResolvedValue([t1]);
    const useCase = new ListReminderTemplatesUseCase(repository, groupRepository, templateMapper);

    const result = await useCase.execute({ groupId: 'group-1' }, { identityId: 'identity-1' });

    expect(repository.findByGroupId).toHaveBeenCalledWith('group-1', 'identity-1', {
      includeHistory: true,
      historyLimit: 1,
    });
    expect(repository.findActive).not.toHaveBeenCalled();
    expect(repository.findByIdentityId).not.toHaveBeenCalled();
    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.data).toEqual({
        templates: [{ id: 't1' }],
        total: 1,
        page: 1,
        pageSize: 1,
        hasMore: false,
      });
    }
  });

  it('queries active templates when effectiveEnabled is true', async () => {
    const t1 = createTemplate('t1');
    const t2 = createTemplate('t2');
    repository.findActive.mockResolvedValue([t1, t2]);
    const useCase = new ListReminderTemplatesUseCase(repository, groupRepository, templateMapper);

    const result = await useCase.execute({ effectiveEnabled: true }, { identityId: 'identity-1' });

    expect(repository.findActive).toHaveBeenCalledWith('identity-1', {
      includeHistory: true,
      historyLimit: 1,
    });
    expect(repository.findByGroupId).not.toHaveBeenCalled();
    expect(repository.findByIdentityId).not.toHaveBeenCalled();
    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.data.total).toBe(2);
      expect(result.data.templates).toEqual([{ id: 't1' }, { id: 't2' }]);
    }
  });

  it('queries by identity by default', async () => {
    const t1 = createTemplate('t1');
    repository.findByIdentityId.mockResolvedValue([t1]);
    const useCase = new ListReminderTemplatesUseCase(repository, groupRepository, templateMapper);

    const result = await useCase.execute(undefined, { identityId: 'identity-1' });

    expect(repository.findByIdentityId).toHaveBeenCalledWith('identity-1', {
      includeHistory: true,
      historyLimit: 1,
    });
    expect(repository.findByGroupId).not.toHaveBeenCalled();
    expect(repository.findActive).not.toHaveBeenCalled();
    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.data).toEqual({
        templates: [{ id: 't1' }],
        total: 1,
        page: 1,
        pageSize: 1,
        hasMore: false,
      });
    }
  });
});
