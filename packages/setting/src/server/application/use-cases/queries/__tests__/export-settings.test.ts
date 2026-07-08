import { describe, it, expect, vi, beforeEach } from 'vitest';
import { createMockRepo } from '@dailyuse/test-utils/mocks';
import { anIdentityId } from '@dailyuse/test-utils/fixtures';
import type { IUserSettingRepository } from '@/server/domain/repositories/i-user-setting-repository';
import { UserSetting } from '@/server/domain/aggregates/user-setting';
import { ExportSettings } from '../export-settings';

// Mock eventBus to prevent real event publishing
vi.mock('@dailyuse/utils', async () => {
  const actual = await vi.importActual<typeof import('@dailyuse/utils')>('@dailyuse/utils');
  return { ...actual, eventBus: { send: vi.fn() } };
});

describe('ExportSettings', () => {
  let repo: ReturnType<typeof createMockRepo<IUserSettingRepository>>;
  let useCase: ExportSettings;
  const identityId = anIdentityId();

  beforeEach(() => {
    vi.clearAllMocks();
    repo = createMockRepo<IUserSettingRepository>({
      findByIdentityId: vi.fn(),
    });
    useCase = new ExportSettings(repo);
  });

  it('should throw when setting not found', async () => {
    vi.mocked(repo.findByIdentityId).mockResolvedValue(null);

    await expect(useCase.execute(identityId)).rejects.toThrow('User setting not found');
  });

  it('should return export payload with version and settings', async () => {
    const setting = UserSetting.create({ identityId });
    vi.mocked(repo.findByIdentityId).mockResolvedValue(setting);

    const result = await useCase.execute(identityId);

    expect(result.version).toBe('2.0.0');
    expect(result.identityId).toBe(identityId);
    expect(result.settings).toBeDefined();
    expect(result.exportedAt).toBeDefined();
  });

  it('should include current preferences in export', async () => {
    const setting = UserSetting.create({ identityId });
    setting.patchCategory('appearance', { theme: 'dark' });
    vi.mocked(repo.findByIdentityId).mockResolvedValue(setting);

    const result = await useCase.execute(identityId);

    expect((result.settings as any).appearance.theme).toBe('dark');
  });

  it('should include valid ISO timestamp in exportedAt', async () => {
    const setting = UserSetting.create({ identityId });
    vi.mocked(repo.findByIdentityId).mockResolvedValue(setting);

    const result = await useCase.execute(identityId);

    const date = new Date(result.exportedAt as string);
    expect(date.getTime()).not.toBeNaN();
  });

  it('should look up by identityId', async () => {
    const setting = UserSetting.create({ identityId });
    vi.mocked(repo.findByIdentityId).mockResolvedValue(setting);

    await useCase.execute(identityId);

    expect(repo.findByIdentityId).toHaveBeenCalledWith(identityId);
  });
});
