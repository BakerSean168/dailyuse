import { describe, it, expect, vi, beforeEach } from 'vitest';
import { createMockRepo } from '@dailyuse/test-utils/mocks';
import { anIdentityId } from '@dailyuse/test-utils/fixtures';
import type { IUserSettingRepository } from '@/domain-server/repositories/IUserSettingRepository';
import { UserSetting } from '@/domain-server/aggregates/user-setting';
import { getDefaultPreferences } from '@dailyuse/contracts/setting';
import { ResetUserSetting } from '../reset-user-setting';

// Mock eventBus to prevent real event publishing
vi.mock('@dailyuse/utils', async () => {
  const actual = await vi.importActual<typeof import('@dailyuse/utils')>('@dailyuse/utils');
  return { ...actual, eventBus: { send: vi.fn() } };
});

describe('ResetUserSetting', () => {
  let repo: ReturnType<typeof createMockRepo<IUserSettingRepository>>;
  let useCase: ResetUserSetting;
  const identityId = anIdentityId();

  beforeEach(() => {
    vi.clearAllMocks();
    repo = createMockRepo<IUserSettingRepository>({
      findByIdentityId: vi.fn(),
      save: vi.fn().mockResolvedValue(undefined),
    });
    useCase = new ResetUserSetting(repo);
  });

  it('should throw when setting not found', async () => {
    vi.mocked(repo.findByIdentityId).mockResolvedValue(null);

    await expect(useCase.execute(identityId)).rejects.toThrow('User setting not found');
  });

  it('should reset a specific category to defaults', async () => {
    const setting = UserSetting.create({ identityId });
    setting.patchCategory('appearance', { theme: 'dark', fontSize: 20 });
    vi.mocked(repo.findByIdentityId).mockResolvedValue(setting);

    const result = await useCase.execute(identityId, 'appearance');

    const defaults = getDefaultPreferences();
    expect(result.preferences.appearance).toEqual(defaults.appearance);
    expect(repo.save).toHaveBeenCalledTimes(1);
  });

  it('should preserve other categories when resetting one', async () => {
    const setting = UserSetting.create({ identityId });
    setting.patchCategory('appearance', { theme: 'dark' });
    setting.patchCategory('locale', { language: 'en-US' });
    vi.mocked(repo.findByIdentityId).mockResolvedValue(setting);

    const result = await useCase.execute(identityId, 'appearance');

    // appearance reset, locale kept
    const defaults = getDefaultPreferences();
    expect(result.preferences.appearance).toEqual(defaults.appearance);
    expect(result.preferences.locale.language).toBe('en-US');
  });

  it('should reset all categories when no category specified', async () => {
    const setting = UserSetting.create({ identityId });
    setting.patchCategory('appearance', { theme: 'dark' });
    setting.patchCategory('locale', { language: 'en-US' });
    vi.mocked(repo.findByIdentityId).mockResolvedValue(setting);

    const result = await useCase.execute(identityId);

    const defaults = getDefaultPreferences();
    expect(result.preferences).toEqual(defaults);
  });

  it('should save the setting after reset', async () => {
    const setting = UserSetting.create({ identityId });
    vi.mocked(repo.findByIdentityId).mockResolvedValue(setting);

    await useCase.execute(identityId, 'appearance');

    expect(repo.save).toHaveBeenCalledTimes(1);
  });

  it('should look up the setting by identityId', async () => {
    const setting = UserSetting.create({ identityId });
    vi.mocked(repo.findByIdentityId).mockResolvedValue(setting);

    await useCase.execute(identityId);

    expect(repo.findByIdentityId).toHaveBeenCalledWith(identityId);
  });

  it('should return a valid client DTO', async () => {
    const setting = UserSetting.create({ identityId });
    vi.mocked(repo.findByIdentityId).mockResolvedValue(setting);

    const result = await useCase.execute(identityId);

    expect(result.id).toBeDefined();
    expect(result.identityId).toBe(identityId);
    expect(typeof result.createdAt).toBe('number');
  });
});
