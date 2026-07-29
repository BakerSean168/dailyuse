import { describe, it, expect, vi, beforeEach } from 'vitest';
import { createMockRepo } from '@memoflow/test-utils/mocks';
import type { IAccountRepository } from '../../../../domain/repositories/i-account-repository';
import { Account } from '../../../../domain/aggregates/account';
import { IdentityId } from '@memoflow/domain-shared/shared';
import { CloseAccountUseCase } from '../close-account.use-case';

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

    const result = await useCase.execute({ reason: 'Test', feedback: '' }, { identityId: account.id.toString() });

    expect(result.ok).toBe(true);
    expect(repo.save).toHaveBeenCalledTimes(1);
  });

  it('should return NOT_FOUND if account not found', async () => {
    (repo.findById as ReturnType<typeof vi.fn>).mockResolvedValue(null);

    const result = await useCase.execute({ reason: 'Test', feedback: '' }, { identityId: 'nonexistent' });

    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.error.code).toBe('NOT_FOUND');
    }
  });

  it('should propagate aggregate close() errors', async () => {
    const account = anAccount();
    account.close(); // first close succeeds
    (repo.findById as ReturnType<typeof vi.fn>).mockResolvedValue(account);

    await expect(
      useCase.execute({ reason: 'Again', feedback: '' }, { identityId: account.id.toString() }),
    ).rejects.toThrow('Account is already closed');
  });
});
