import { describe, it, expect, vi, beforeEach } from 'vitest';
import { createMockRepo } from '@memoflow/test-utils/mocks';
import type { IAccountRepository } from '../../../../domain/repositories/i-account-repository';
import { Account } from '../../../../domain/aggregates/account';
import { IdentityId } from '@memoflow/domain-shared/shared';
import { UpdateAccountSettingsUseCase } from '../update-account-settings.use-case';

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

    const result = await useCase.execute({ theme: 'Dark' }, { identityId: account.id.toString() });

    expect(result.ok).toBe(true);
    expect(account.settings.isDarkTheme()).toBe(true);
    if (result.ok) {
      expect(result.data.theme).toBe('Dark');
    }
  });

  it('should update language', async () => {
    const account = anAccount();
    (repo.findById as ReturnType<typeof vi.fn>).mockResolvedValue(account);

    const result = await useCase.execute({ language: 'en-US' }, { identityId: account.id.toString() });

    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.data.language).toBe('en-US');
    }
  });

  it('should update timezone', async () => {
    const account = anAccount();
    (repo.findById as ReturnType<typeof vi.fn>).mockResolvedValue(account);

    const result = await useCase.execute({ timezone: 'America/New_York' }, { identityId: account.id.toString() });

    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.data.timezone).toBe('America/New_York');
    }
  });

  it('should disable notification', async () => {
    const account = anAccount();
    (repo.findById as ReturnType<typeof vi.fn>).mockResolvedValue(account);

    const result = await useCase.execute({ notificationEnabled: false }, { identityId: account.id.toString() });

    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.data.notificationEnabled).toBe(false);
    }
  });

  it('should enable notification', async () => {
    const account = anAccount();
    (repo.findById as ReturnType<typeof vi.fn>).mockResolvedValue(account);
    await useCase.execute({ notificationEnabled: false }, { identityId: account.id.toString() });

    const result = await useCase.execute({ notificationEnabled: true }, { identityId: account.id.toString() });

    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.data.notificationEnabled).toBe(true);
    }
  });

  it('should apply multiple settings updates at once', async () => {
    const account = anAccount();
    (repo.findById as ReturnType<typeof vi.fn>).mockResolvedValue(account);

    const result = await useCase.execute({
      theme: 'Light',
      language: 'ja-JP',
      timezone: 'Asia/Tokyo',
      notificationEnabled: false,
    }, { identityId: account.id.toString() });

    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.data.theme).toBe('Light');
      expect(result.data.language).toBe('ja-JP');
      expect(result.data.timezone).toBe('Asia/Tokyo');
      expect(result.data.notificationEnabled).toBe(false);
    }
  });

  it('should return NOT_FOUND when account not found', async () => {
    (repo.findById as ReturnType<typeof vi.fn>).mockResolvedValue(null);

    const result = await useCase.execute({ theme: 'Dark' }, { identityId: 'missing' });

    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.error.code).toBe('NOT_FOUND');
    }
  });

  it('should save the account after updating settings', async () => {
    const account = anAccount();
    (repo.findById as ReturnType<typeof vi.fn>).mockResolvedValue(account);

    await useCase.execute({ theme: 'Dark' }, { identityId: account.id.toString() });

    expect(repo.save).toHaveBeenCalledWith(account);
  });
});
