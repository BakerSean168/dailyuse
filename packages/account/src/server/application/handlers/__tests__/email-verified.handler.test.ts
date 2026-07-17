import { describe, it, expect, vi, beforeEach } from 'vitest';
import { createMockRepo } from '@dailyuse/test-utils/mocks';
import type { IAccountRepository } from '../../../domain/repositories/i-account-repository';
import { Account } from '../../../domain/aggregates/account';
import { IdentityId } from '@dailyuse/domain-shared/shared';
import { EmailVerifiedHandler } from '../email-verified.handler';

vi.mock('@dailyuse/utils', async () => {
  const actual = await vi.importActual<typeof import('@dailyuse/utils')>('@dailyuse/utils');
  return {
    ...actual,
    createLogger: () => ({
      info: vi.fn(),
      warn: vi.fn(),
      error: vi.fn(),
      debug: vi.fn(),
    }),
  };
});

describe('EmailVerifiedHandler', () => {
  let repo: ReturnType<typeof createMockRepo<IAccountRepository>>;
  let handler: EmailVerifiedHandler;

  beforeEach(() => {
    vi.clearAllMocks();
    repo = createMockRepo<IAccountRepository>({
      findById: vi.fn().mockResolvedValue(null),
      save: vi.fn().mockResolvedValue(undefined),
    });
    handler = new EmailVerifiedHandler(repo);
  });

  it('projects verified email onto existing account', async () => {
    const account = Account.create({
      id: IdentityId.generate(),
      email: 'user@example.com',
    });
    expect(account.email.isVerified).toBe(false);
    (repo.findById as ReturnType<typeof vi.fn>).mockResolvedValue(account);

    await handler.handle({
      payload: {
        identityId: account.id as any,
        email: 'user@example.com',
      },
    });

    expect(account.email.isVerified).toBe(true);
    expect(account.email.address).toBe('user@example.com');
    expect(repo.save).toHaveBeenCalledWith(account);
  });

  it('is idempotent when already verified', async () => {
    const account = Account.create({
      id: IdentityId.generate(),
      email: 'user@example.com',
    });
    account.syncVerifiedEmail('user@example.com');
    (repo.findById as ReturnType<typeof vi.fn>).mockResolvedValue(account);

    await handler.handle({
      payload: {
        identityId: account.id as any,
        email: 'user@example.com',
      },
    });

    expect(account.email.isVerified).toBe(true);
    expect(repo.save).toHaveBeenCalled();
  });

  it('skips when account is missing', async () => {
    await handler.handle({
      payload: {
        identityId: IdentityId.generate() as any,
        email: 'missing@example.com',
      },
    });
    expect(repo.save).not.toHaveBeenCalled();
  });
});
