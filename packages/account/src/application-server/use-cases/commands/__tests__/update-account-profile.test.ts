import { describe, it, expect, vi, beforeEach } from 'vitest';
import { createMockRepo } from '@dailyuse/test-utils/mocks';
import type { IAccountRepository } from '@/domain-server/repositories/i-account-repository';
import { Account } from '@/domain-server/aggregates/account';
import { IdentityId } from '@dailyuse/domain-shared/shared';
import { UpdateAccountProfileUseCase } from '../update-account-profile.use-case';

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

    const result = await useCase.execute({ nickname: 'NewNick' }, { identityId: account.id.toString() });

    expect(result.ok).toBe(true);
    expect(account.profile.nickname).toBe('NewNick');
    expect(repo.save).toHaveBeenCalledWith(account);
  });

  it('should update avatar', async () => {
    const account = anAccount();
    (repo.findById as ReturnType<typeof vi.fn>).mockResolvedValue(account);

    const result = await useCase.execute({
      avatar: 'https://example.com/new-avatar.png',
    }, { identityId: account.id.toString() });

    expect(result.ok).toBe(true);
    expect(account.profile.avatarUrl).toBe('https://example.com/new-avatar.png');
  });

  it('should update bio', async () => {
    const account = anAccount();
    (repo.findById as ReturnType<typeof vi.fn>).mockResolvedValue(account);

    const result = await useCase.execute({ bio: 'Hello world' }, { identityId: account.id.toString() });

    expect(result.ok).toBe(true);
    expect(account.profile.bio).toBe('Hello world');
  });

  it('should apply multiple updates at once', async () => {
    const account = anAccount();
    (repo.findById as ReturnType<typeof vi.fn>).mockResolvedValue(account);

    const result = await useCase.execute({
      nickname: 'Multi',
      avatar: 'https://example.com/a.png',
      bio: 'Multi update',
    }, { identityId: account.id.toString() });

    expect(result.ok).toBe(true);
    expect(account.profile.nickname).toBe('Multi');
    expect(account.profile.avatarUrl).toBe('https://example.com/a.png');
    expect(account.profile.bio).toBe('Multi update');
  });

  it('should return account client DTO', async () => {
    const account = anAccount();
    (repo.findById as ReturnType<typeof vi.fn>).mockResolvedValue(account);

    const result = await useCase.execute({ nickname: 'WithDTO' }, { identityId: account.id.toString() });

    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.data.profile.nickname).toBe('WithDTO');
    }
  });

  it('should return NOT_FOUND when account not found', async () => {
    (repo.findById as ReturnType<typeof vi.fn>).mockResolvedValue(null);

    const result = await useCase.execute({ nickname: 'X' }, { identityId: 'missing-id' });

    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.error.code).toBe('NOT_FOUND');
    }
  });

  it('should not change profile when no fields provided', async () => {
    const account = anAccount('nochange@example.com');
    (repo.findById as ReturnType<typeof vi.fn>).mockResolvedValue(account);

    const result = await useCase.execute({}, { identityId: account.id.toString() });

    expect(result.ok).toBe(true);
    expect(repo.save).toHaveBeenCalled();
  });
});
