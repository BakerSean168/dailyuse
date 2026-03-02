import { describe, it, expect, vi, beforeEach } from 'vitest';
import { createMockRepo } from '@dailyuse/test-utils/mocks';
import type { IAccountRepository } from '../../../domain-server/repositories/i-account-repository';
import { Account } from '../../../domain-server/aggregates/account';
import { IdentityId } from '@dailyuse/domain-shared/shared';
import { IdentityCreatedHandler } from '../identity-created.handler';
import type { AuthEventMap } from '@dailyuse/contracts/authentication';

// Suppress logger output in tests
vi.mock('@dailyuse/utils', async (importOriginal) => {
  const actual = await importOriginal<typeof import('@dailyuse/utils')>();
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

describe('IdentityCreatedHandler', () => {
  let repo: ReturnType<typeof createMockRepo<IAccountRepository>>;
  let handler: IdentityCreatedHandler;

  function anEvent(overrides: Partial<AuthEventMap['auth:identity-created']> = {}): {
    payload: AuthEventMap['auth:identity-created'];
  } {
    return {
      payload: {
        identityId: IdentityId.generate() as any,
        createMethod: 'EMAIL',
        email: 'newuser@example.com',
        ...overrides,
      },
    };
  }

  beforeEach(() => {
    vi.clearAllMocks();
    repo = createMockRepo<IAccountRepository>({
      findById: vi.fn().mockResolvedValue(null),
      save: vi.fn().mockResolvedValue(undefined),
    });
    handler = new IdentityCreatedHandler(repo);
  });

  it('should create account when identity is created via EMAIL', async () => {
    const event = anEvent({ email: 'test@example.com' });

    await handler.handle(event);

    expect(repo.save).toHaveBeenCalledTimes(1);
    const savedAccount = (repo.save as ReturnType<typeof vi.fn>).mock.calls[0][0];
    expect(savedAccount).toBeInstanceOf(Account);
    expect(savedAccount.email.address).toBe('test@example.com');
  });

  it('should skip if account already exists (idempotency)', async () => {
    const existingAccount = Account.create({
      id: IdentityId.generate(),
      email: 'existing@example.com',
    });
    (repo.findById as ReturnType<typeof vi.fn>).mockResolvedValue(existingAccount);

    const event = anEvent({
      identityId: existingAccount.id as any,
      email: 'existing@example.com',
    });

    await handler.handle(event);

    expect(repo.save).not.toHaveBeenCalled();
  });

  it('should throw when no email provided for OAUTH creation', async () => {
    const event = anEvent({
      createMethod: 'OAUTH',
      email: undefined,
      oauthProvider: 'google',
    });

    await expect(handler.handle(event)).rejects.toThrow('Email is required');
  });

  it('should throw when no email provided for PHONE creation', async () => {
    const event = anEvent({
      createMethod: 'PHONE',
      email: undefined,
      phoneNumber: '13800138000',
    });

    await expect(handler.handle(event)).rejects.toThrow('Email is required');
  });

  it('should throw when no email provided at all', async () => {
    const event = anEvent({
      createMethod: 'EMAIL',
      email: undefined,
    });

    await expect(handler.handle(event)).rejects.toThrow('Email is required');
  });

  it('should re-throw errors from repository save', async () => {
    (repo.save as ReturnType<typeof vi.fn>).mockRejectedValue(new Error('DB error'));
    const event = anEvent();

    await expect(handler.handle(event)).rejects.toThrow('DB error');
  });
});
