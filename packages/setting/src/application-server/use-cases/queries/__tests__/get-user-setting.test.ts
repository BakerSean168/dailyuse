import { describe, it, expect, vi, beforeEach } from 'vitest';
import { createMockRepo } from '@dailyuse/test-utils/mocks';
import { anIdentityId } from '@dailyuse/test-utils/fixtures';
import type { IUserSettingRepository } from '@/domain-server/repositories/i-user-setting-repository';
import { UserSetting } from '@/domain-server/aggregates/user-setting';
import { getDefaultPreferences } from '@dailyuse/contracts/setting';
import { GetUserSetting } from '../get-user-setting';

// Mock eventBus to prevent real event publishing
vi.mock('@dailyuse/utils', async () => {
  const actual = await vi.importActual<typeof import('@dailyuse/utils')>('@dailyuse/utils');
  return { ...actual, eventBus: { send: vi.fn() } };
});

describe('GetUserSetting', () => {
  let repo: ReturnType<typeof createMockRepo<IUserSettingRepository>>;
  let useCase: GetUserSetting;
  const identityId = anIdentityId();

  beforeEach(() => {
    vi.clearAllMocks();
    repo = createMockRepo<IUserSettingRepository>({
      findByIdentityId: vi.fn(),
      save: vi.fn().mockResolvedValue(undefined),
    });
    useCase = new GetUserSetting(repo);
  });

  it('should return existing setting as client DTO', async () => {
    const setting = UserSetting.create({ identityId });
    setting.patchCategory('appearance', { theme: 'dark' });
    vi.mocked(repo.findByIdentityId).mockResolvedValue(setting);

    const result = await useCase.execute(identityId);

    expect(result.preferences.appearance.theme).toBe('dark');
    expect(result.identityId).toBe(identityId);
  });

  it('should create and save default setting when none exists', async () => {
    vi.mocked(repo.findByIdentityId).mockResolvedValue(null);

    const result = await useCase.execute(identityId);

    expect(repo.save).toHaveBeenCalledTimes(1);
    const defaults = getDefaultPreferences();
    expect(result.preferences.appearance).toEqual(defaults.appearance);
    expect(result.preferences.locale).toEqual(defaults.locale);
  });

  it('should return defaults without saving when persistence is disabled', async () => {
    vi.mocked(repo.findByIdentityId).mockResolvedValue(null);
    useCase = new GetUserSetting(repo, { persistOnMissing: false });

    const result = await useCase.execute(identityId);

    expect(repo.save).not.toHaveBeenCalled();
    expect(result.identityId).toBe(identityId);
  });

  it('should not save when setting already exists', async () => {
    const setting = UserSetting.create({ identityId });
    vi.mocked(repo.findByIdentityId).mockResolvedValue(setting);

    await useCase.execute(identityId);

    expect(repo.save).not.toHaveBeenCalled();
  });

  it('should look up by identityId', async () => {
    vi.mocked(repo.findByIdentityId).mockResolvedValue(null);

    await useCase.execute(identityId);

    expect(repo.findByIdentityId).toHaveBeenCalledWith(identityId);
  });

  it('should return complete client DTO structure', async () => {
    vi.mocked(repo.findByIdentityId).mockResolvedValue(null);

    const result = await useCase.execute(identityId);

    expect(result.id).toBeDefined();
    expect(result.identityId).toBeDefined();
    expect(result.preferences).toBeDefined();
    expect(result.version).toBeDefined();
    expect(typeof result.createdAt).toBe('number');
    expect(typeof result.updatedAt).toBe('number');
  });
});
