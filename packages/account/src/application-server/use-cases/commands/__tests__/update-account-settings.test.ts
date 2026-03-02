import { describe, it, expect, vi, beforeEach } from 'vitest';
import { createMockRepo } from '@dailyuse/test-utils/mocks';
import type { IAccountRepository } from '@/domain-server/repositories/i-account-repository';
import { Account } from '@/domain-server/aggregates/account';
import { IdentityId } from '@dailyuse/domain-shared/shared';
import { UpdateAccountSettingsUseCase } from '../update-account-settings';

describe('UpdateAccountSettingsUseCase', () => {
  let repo: ReturnType<typeof createMockRepo<IAccountRepository>>;
  let useCase: UpdateAccountSettingsUseCase;

  function anAccount() {
    return Account.create({ id: IdentityId.generate(), email: 'settings@example.com' });
  }

  beforeEach(() => {
    vi.clearAllMocks();
    repo = createMockRepo<IAccountRepository>({
      save: vi.fn().mockResolvedValue(undefined),
    });
    useCase = new UpdateAccountSettingsUseCase(repo);
  });

  it('should update theme', async () => {
    const account = anAccount();
    (repo.findById as ReturnType<typeof vi.fn>).mockResolvedValue(account);

    const result = await useCase.execute(account.id.toString(), { theme: 'DARK' });

    expect(result.success).toBe(true);
    // Bug fix verification: settings written back to aggregate
    expect(account.settings.isDarkTheme()).toBe(true);
    expect(result.settings.theme).toBe('DARK');
  });

  it('should update language', async () => {
    const account = anAccount();
    (repo.findById as ReturnType<typeof vi.fn>).mockResolvedValue(account);

    const result = await useCase.execute(account.id.toString(), { language: 'en-US' });

    expect(result.success).toBe(true);
    expect(result.settings.language).toBe('en-US');
  });

  it('should update timezone', async () => {
    const account = anAccount();
    (repo.findById as ReturnType<typeof vi.fn>).mockResolvedValue(account);

    const result = await useCase.execute(account.id.toString(), { timezone: 'America/New_York' });

    expect(result.success).toBe(true);
    expect(result.settings.timezone).toBe('America/New_York');
  });

  it('should disable notification', async () => {
    const account = anAccount();
    (repo.findById as ReturnType<typeof vi.fn>).mockResolvedValue(account);

    const result = await useCase.execute(account.id.toString(), { notificationEnabled: false });

    expect(result.success).toBe(true);
    expect(result.settings.notificationEnabled).toBe(false);
  });

  it('should enable notification', async () => {
    const account = anAccount();
    // First disable
    (repo.findById as ReturnType<typeof vi.fn>).mockResolvedValue(account);
    await useCase.execute(account.id.toString(), { notificationEnabled: false });
    // Then re-enable
    const result = await useCase.execute(account.id.toString(), { notificationEnabled: true });

    expect(result.success).toBe(true);
    expect(result.settings.notificationEnabled).toBe(true);
  });

  it('should apply multiple settings updates at once', async () => {
    const account = anAccount();
    (repo.findById as ReturnType<typeof vi.fn>).mockResolvedValue(account);

    const result = await useCase.execute(account.id.toString(), {
      theme: 'LIGHT',
      language: 'ja-JP',
      timezone: 'Asia/Tokyo',
      notificationEnabled: false,
    });

    expect(result.success).toBe(true);
    expect(result.settings.theme).toBe('LIGHT');
    expect(result.settings.language).toBe('ja-JP');
    expect(result.settings.timezone).toBe('Asia/Tokyo');
    expect(result.settings.notificationEnabled).toBe(false);
  });

  it('should throw when account not found', async () => {
    (repo.findById as ReturnType<typeof vi.fn>).mockResolvedValue(null);

    await expect(useCase.execute('missing', { theme: 'DARK' })).rejects.toThrow(
      'Account not found',
    );
  });

  it('should save the account after updating settings', async () => {
    const account = anAccount();
    (repo.findById as ReturnType<typeof vi.fn>).mockResolvedValue(account);

    await useCase.execute(account.id.toString(), { theme: 'DARK' });

    expect(repo.save).toHaveBeenCalledWith(account);
  });
});
