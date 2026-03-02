import { describe, it, expect, vi, beforeEach } from 'vitest';
import { createMockRepo } from '@dailyuse/test-utils/mocks';
import type { IAccountRepository } from '../../repositories/i-account-repository';
import { AccountUniquenessChecker } from '../account-uniqueness-checker';
import { Account } from '../../aggregates/account';
import { IdentityId } from '@dailyuse/domain-shared/shared';

describe('AccountUniquenessChecker', () => {
  let repo: ReturnType<typeof createMockRepo<IAccountRepository>>;
  let checker: AccountUniquenessChecker;

  beforeEach(() => {
    vi.clearAllMocks();
    repo = createMockRepo<IAccountRepository>();
    checker = new AccountUniquenessChecker(repo);
  });

  describe('isEmailUnique', () => {
    it('should return true when email does not exist', async () => {
      (repo.findByEmail as ReturnType<typeof vi.fn>).mockResolvedValue(null);

      const result = await checker.isEmailUnique('new@example.com');

      expect(result).toBe(true);
      expect(repo.findByEmail).toHaveBeenCalledWith('new@example.com');
    });

    it('should return false when email already exists', async () => {
      const existing = Account.create({
        id: IdentityId.generate(),
        email: 'taken@example.com',
      });
      (repo.findByEmail as ReturnType<typeof vi.fn>).mockResolvedValue(existing);

      const result = await checker.isEmailUnique('taken@example.com');

      expect(result).toBe(false);
    });
  });
});
