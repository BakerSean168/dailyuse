import { describe, it, expect, vi, beforeEach } from 'vitest';
import { createMockRepo } from '@dailyuse/test-utils/mocks';
import type { IAccountRepository } from '@/domain-server/repositories/i-account-repository';
import { Account } from '@/domain-server/aggregates/account';
import { IdentityId } from '@dailyuse/domain-shared/shared';
import { CloseAccountUseCase } from '../close-account';

describe('CloseAccountUseCase', () => {
  let repo: ReturnType<typeof createMockRepo<IAccountRepository>>;
  let useCase: CloseAccountUseCase;

  function anAccount(overrides: { email?: string } = {}) {
    return Account.create({
      id: IdentityId.generate(),
      email: overrides.email ?? 'test@example.com',
    });
  }

  beforeEach(() => {
    vi.clearAllMocks();
    repo = createMockRepo<IAccountRepository>({
      save: vi.fn().mockResolvedValue(undefined),
    });
    useCase = new CloseAccountUseCase(repo);
  });

  it('should close an active account', async () => {
    const account = anAccount();
    (repo.findById as ReturnType<typeof vi.fn>).mockResolvedValue(account);

    const result = await useCase.execute(account.id.toString(), { reason: 'Test', feedback: '' });

    expect(result.success).toBe(true);
    expect(result.message).toBe('Account closed successfully');
    expect(repo.save).toHaveBeenCalledTimes(1);
  });

  it('should throw if account not found', async () => {
    (repo.findById as ReturnType<typeof vi.fn>).mockResolvedValue(null);

    await expect(useCase.execute('nonexistent', { reason: 'Test', feedback: '' })).rejects.toThrow(
      'Account not found',
    );
  });

  it('should propagate aggregate close() errors', async () => {
    const account = anAccount();
    account.close(); // first close succeeds
    (repo.findById as ReturnType<typeof vi.fn>).mockResolvedValue(account);

    await expect(
      useCase.execute(account.id.toString(), { reason: 'Again', feedback: '' }),
    ).rejects.toThrow('Account is already closed');
  });
});
