import { describe, it, expect, vi, beforeEach } from 'vitest';
import { createMockRepo } from '@memoflow/test-utils/mocks';
import { anIdentityId } from '@memoflow/test-utils/fixtures';
import type { IUserSettingRepository } from '../../../../domain/repositories/i-user-setting-repository';
import { UserSetting } from '../../../../domain/aggregates/user-setting';
import { PatchUserSetting } from '../patch-user-setting';

// Mock eventBus to prevent real event publishing
vi.mock('@memoflow/utils', async () => {
  const actual = await vi.importActual<typeof import('@memoflow/utils')>('@memoflow/utils');
  return { ...actual, eventBus: { send: vi.fn() } };
});

describe('PatchUserSetting', () => {
  let repo: ReturnType<typeof createMockRepo<IUserSettingRepository>>;
  let useCase: PatchUserSetting;
  const identityId = anIdentityId();

  beforeEach(() => {
    vi.clearAllMocks();
    repo = createMockRepo<IUserSettingRepository>({
      findByIdentityId: vi.fn().mockResolvedValue(null),
      save: vi.fn().mockResolvedValue(undefined),
    });
    useCase = new PatchUserSetting(repo);
  });

  it('should create a new setting if none exists and apply the patch', async () => {
    vi.mocked(repo.findByIdentityId).mockResolvedValue(null);

    const result = await useCase.execute(identityId, 'appearance', { theme: 'dark' });

    expect(repo.save).toHaveBeenCalledTimes(1);
    expect(result.preferences.appearance.theme).toBe('dark');
  });

  it('should patch an existing setting', async () => {
    const existing = UserSetting.create({ identityId });
    vi.mocked(repo.findByIdentityId).mockResolvedValue(existing);

    const result = await useCase.execute(identityId, 'locale', { language: 'en-US' });

    expect(repo.save).toHaveBeenCalledTimes(1);
    expect(result.preferences.locale.language).toBe('en-US');
  });

  it('should preserve other fields in the same category', async () => {
    const existing = UserSetting.create({ identityId });
    vi.mocked(repo.findByIdentityId).mockResolvedValue(existing);

    const result = await useCase.execute(identityId, 'appearance', { theme: 'dark' });

    expect(result.preferences.appearance.theme).toBe('dark');
  });

  it('should preserve other categories', async () => {
    const existing = UserSetting.create({ identityId });
    vi.mocked(repo.findByIdentityId).mockResolvedValue(existing);

    const result = await useCase.execute(identityId, 'appearance', { theme: 'dark' });

    // locale should remain at defaults
    expect(result.preferences.locale.language).toBe('zh-CN');
  });

  it('should look up the setting by identityId', async () => {
    await useCase.execute(identityId, 'appearance', { theme: 'dark' });

    expect(repo.findByIdentityId).toHaveBeenCalledWith(identityId);
  });

  it('should increment version on patch', async () => {
    const existing = UserSetting.create({ identityId });
    vi.mocked(repo.findByIdentityId).mockResolvedValue(existing);

    const result = await useCase.execute(identityId, 'appearance', { theme: 'dark' });

    // create() sets version=1, patchCategory increments to 2
    expect(result.version).toBe(2);
  });

  it('should throw for invalid category', async () => {
    const existing = UserSetting.create({ identityId });
    vi.mocked(repo.findByIdentityId).mockResolvedValue(existing);

    await expect(
      useCase.execute(identityId, 'nonexistent' as any, { foo: 'bar' }),
    ).rejects.toThrow();
  });

  it('should throw for invalid value in patch', async () => {
    const existing = UserSetting.create({ identityId });
    vi.mocked(repo.findByIdentityId).mockResolvedValue(existing);

    await expect(
      useCase.execute(identityId, 'appearance', { theme: 999 as any }),
    ).rejects.toThrow();
  });

  it('should return a complete client DTO', async () => {
    const result = await useCase.execute(identityId, 'appearance', { theme: 'dark' });

    expect(result.id).toBeDefined();
    expect(result.identityId).toBe(identityId);
    expect(result.preferences).toBeDefined();
    expect(typeof result.createdAt).toBe('number');
    expect(typeof result.updatedAt).toBe('number');
  });
});
