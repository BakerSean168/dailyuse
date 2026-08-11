import { describe, it, expect, vi, beforeEach } from 'vitest';
import { AccountClosureCoordinator } from '../account-closure-coordinator';
import { InMemoryAccountClosureOperationRepository } from '../../../infrastructure/adapters/in-memory/account-closure-operation-in-memory.repository';
import type { IAccountRepository } from '../../../domain/repositories/i-account-repository';
import type { CloudAuthRevocationPort } from '../../ports/cloud-auth-revocation.port';
import type { AccountClosureEventPublisher } from '../../ports/account-closure-event-publisher.port';
import { Account } from '../../../domain/aggregates/account';
import { IdentityId } from '@memoflow/domain-shared/shared';
import { AccountStatus } from '../../../domain/value-objects';

describe('AccountClosureCoordinator Unit Tests', () => {
  let closureOpRepo: InMemoryAccountClosureOperationRepository;
  let mockAccountRepo: IAccountRepository;
  let mockRevocationPort: CloudAuthRevocationPort;
  let mockEventPublisher: AccountClosureEventPublisher;
  let coordinator: AccountClosureCoordinator;

  const testIdentityId = IdentityId.generate().toString();
  let testAccount: Account;

  beforeEach(() => {
    vi.clearAllMocks();
    closureOpRepo = new InMemoryAccountClosureOperationRepository();

    testAccount = Account.create({
      id: IdentityId.of(testIdentityId),
      email: 'user@example.com',
    });

    mockAccountRepo = {
      findById: vi.fn().mockImplementation(async (id: string) => {
        if (id === testIdentityId) return testAccount;
        return null;
      }),
      save: vi.fn().mockResolvedValue(undefined),
      findByNickname: vi.fn(),
      findByEmail: vi.fn(),
      existsByNickname: vi.fn(),
      existsByEmail: vi.fn(),
      delete: vi.fn(),
      findAll: vi.fn(),
    };

    mockRevocationPort = {
      revokeAll: vi.fn().mockResolvedValue({ revokedSessions: 3 }),
    };

    mockEventPublisher = {
      publishAccountClosed: vi.fn().mockResolvedValue(undefined),
    };

    coordinator = new AccountClosureCoordinator({
      accountRepository: mockAccountRepo,
      closureOperationRepository: closureOpRepo,
      revocationPort: mockRevocationPort,
      eventPublisher: mockEventPublisher,
      clock: { now: () => new Date(1700000000000) },
    });
  });

  it('should successfully execute closure saga and publish account-closed event', async () => {
    const receipt = await coordinator.execute(testIdentityId, 'idempotency-key-1');

    expect(receipt.status).toBe('succeeded');
    expect(receipt.phase).toBe('closed');
    expect(receipt.lastError).toBeNull();
    expect(receipt.finishedAt).toBe(1700000000000);

    // Verify side effects
    expect(mockRevocationPort.revokeAll).toHaveBeenCalledWith(testIdentityId);
    expect(AccountStatus.isDeactivated(testAccount.status)).toBe(true);
    expect(mockAccountRepo.save).toHaveBeenCalledWith(testAccount);
    expect(mockEventPublisher.publishAccountClosed).toHaveBeenCalledWith(
      expect.objectContaining({
        identityId: testIdentityId,
        accountId: testIdentityId,
        reason: 'User requested closure',
      }),
    );
  });

  it('should be idempotent: second call with same key returns existing receipt without re-running side effects', async () => {
    const receipt1 = await coordinator.execute(testIdentityId, 'idempotency-key-2');
    expect(receipt1.status).toBe('succeeded');

    vi.clearAllMocks();

    const receipt2 = await coordinator.execute(testIdentityId, 'idempotency-key-2');
    expect(receipt2).toEqual(receipt1);

    expect(mockRevocationPort.revokeAll).not.toHaveBeenCalled();
    expect(mockEventPublisher.publishAccountClosed).not.toHaveBeenCalled();
  });

  it('should handle failure in revoking phase and allow retry from recovery point', async () => {
    mockRevocationPort.revokeAll = vi
      .fn()
      .mockRejectedValueOnce(new Error('Auth service network error'))
      .mockResolvedValueOnce({ revokedSessions: 2 });

    const receipt1 = await coordinator.execute(testIdentityId, 'idempotency-key-retry');
    expect(receipt1.status).toBe('failed');
    expect(receipt1.phase).toBe('revoking');
    expect(receipt1.lastError).toBe('Auth service network error');
    expect(receipt1.attempts).toBe(1);

    // Account should NOT be closed yet
    expect(AccountStatus.isDeactivated(testAccount.status)).toBe(false);

    // Retry execution
    const receipt2 = await coordinator.execute(testIdentityId, 'idempotency-key-retry');
    expect(receipt2.status).toBe('succeeded');
    expect(receipt2.phase).toBe('closed');
    expect(receipt2.attempts).toBe(2);
    expect(AccountStatus.isDeactivated(testAccount.status)).toBe(true);
  });

  it('should handle failure when account is not found', async () => {
    const nonexistentId = IdentityId.generate().toString();
    const receipt = await coordinator.execute(nonexistentId, 'idempotency-key-notfound');

    expect(receipt.status).toBe('failed');
    expect(receipt.phase).toBe('closing');
    expect(receipt.lastError).toContain(`Account not found for identityId: ${nonexistentId}`);
  });
});
