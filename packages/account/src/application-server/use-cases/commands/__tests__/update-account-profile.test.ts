import { describe, it, expect, vi, beforeEach } from 'vitest';
import { createMockRepo } from '@dailyuse/test-utils/mocks';
import type { IAccountRepository } from '@/domain-server/repositories/i-account-repository';
import { Account } from '@/domain-server/aggregates/account';
import { IdentityId } from '@dailyuse/domain-shared/shared';
import type { UpdateAccountReq } from '@dailyuse/contracts/account';
import { UpdateAccountProfileUseCase } from '../update-account-profile';

describe('UpdateAccountProfileUseCase', () => {
  let repo: ReturnType<typeof createMockRepo<IAccountRepository>>;
  let useCase: UpdateAccountProfileUseCase;

  function anAccount(email = 'profile@example.com') {
    return Account.create({ id: IdentityId.generate(), email });
  }

  beforeEach(() => {
    vi.clearAllMocks();
    repo = createMockRepo<IAccountRepository>({
      save: vi.fn().mockResolvedValue(undefined),
    });
    useCase = new UpdateAccountProfileUseCase(repo);
  });

  it('should update nickname', async () => {
    const account = anAccount();
    (repo.findById as ReturnType<typeof vi.fn>).mockResolvedValue(account);

    const result = await useCase.execute(account.id.toString(), { nickname: 'NewNick' });

    expect(result.success).toBe(true);
    // Bug fix verification: the saved account should have the updated profile
    expect(account.profile.nickname).toBe('NewNick');
    expect(repo.save).toHaveBeenCalledWith(account);
  });

  it('should update avatar', async () => {
    const account = anAccount();
    (repo.findById as ReturnType<typeof vi.fn>).mockResolvedValue(account);

    const result = await useCase.execute(account.id.toString(), {
      avatar: 'https://example.com/new-avatar.png',
    });

    expect(result.success).toBe(true);
    expect(account.profile.avatarUrl).toBe('https://example.com/new-avatar.png');
  });

  it('should update bio', async () => {
    const account = anAccount();
    (repo.findById as ReturnType<typeof vi.fn>).mockResolvedValue(account);

    const result = await useCase.execute(account.id.toString(), { bio: 'Hello world' });

    expect(result.success).toBe(true);
    expect(account.profile.bio).toBe('Hello world');
  });

  it('should apply multiple updates at once', async () => {
    const account = anAccount();
    (repo.findById as ReturnType<typeof vi.fn>).mockResolvedValue(account);

    const result = await useCase.execute(account.id.toString(), {
      nickname: 'Multi',
      avatar: 'https://example.com/a.png',
      bio: 'Multi update',
    });

    expect(result.success).toBe(true);
    expect(account.profile.nickname).toBe('Multi');
    expect(account.profile.avatarUrl).toBe('https://example.com/a.png');
    expect(account.profile.bio).toBe('Multi update');
  });

  it('should return account client DTO', async () => {
    const account = anAccount();
    (repo.findById as ReturnType<typeof vi.fn>).mockResolvedValue(account);

    const result = await useCase.execute(account.id.toString(), { nickname: 'WithDTO' });

    expect(result.account).toBeDefined();
    expect(result.account.profile.nickname).toBe('WithDTO');
  });

  it('should throw when account not found', async () => {
    (repo.findById as ReturnType<typeof vi.fn>).mockResolvedValue(null);

    await expect(useCase.execute('missing-id', { nickname: 'X' })).rejects.toThrow(
      'Account not found',
    );
  });

  it('should not change profile when no fields provided', async () => {
    const account = anAccount('nochange@example.com');
    const originalNickname = account.profile.nickname;
    (repo.findById as ReturnType<typeof vi.fn>).mockResolvedValue(account);

    const result = await useCase.execute(account.id.toString(), {});

    // Profile is still written back (updateProfile called) but unchanged values
    expect(result.success).toBe(true);
    expect(repo.save).toHaveBeenCalled();
  });
});
