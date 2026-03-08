import { describe, it, expect, vi, beforeEach } from 'vitest';
import { createMockRepo } from '@dailyuse/test-utils/mocks';
import type { IAccountRepository } from '@/domain-server/repositories/i-account-repository';
import { Account } from '@/domain-server/aggregates/account';
import { AccountStatus } from '@dailyuse/contracts/account';
import { IdentityId } from '@dailyuse/domain-shared/shared';
import { GetAccountProfileUseCase } from '../get-account-profile';

describe('GetAccountProfileUseCase', () => {
  let repo: ReturnType<typeof createMockRepo<IAccountRepository>>;
  let useCase: GetAccountProfileUseCase;

  function anAccount(email = 'get@example.com') {
    return Account.create({ id: IdentityId.generate(), email });
  }

  beforeEach(() => {
    vi.clearAllMocks();
    repo = createMockRepo<IAccountRepository>();
    useCase = new GetAccountProfileUseCase(repo);
  });

  it('should return account client DTO when found', async () => {
    const account = anAccount();
    (repo.findById as ReturnType<typeof vi.fn>).mockResolvedValue(account);

    const result = await useCase.execute(account.id.toString());

    expect(result).not.toBeNull();
    expect(result!.email.address).toBe('get@example.com');
    expect(result!.status).toBe(AccountStatus.Active);
  });

  it('should return null when account not found', async () => {
    (repo.findById as ReturnType<typeof vi.fn>).mockResolvedValue(null);

    const result = await useCase.execute('nonexistent');

    expect(result).toBeNull();
  });

  it('should call findById with the provided account ID', async () => {
    (repo.findById as ReturnType<typeof vi.fn>).mockResolvedValue(null);

    await useCase.execute('test-id-123');

    expect(repo.findById).toHaveBeenCalledWith('test-id-123');
  });
});
