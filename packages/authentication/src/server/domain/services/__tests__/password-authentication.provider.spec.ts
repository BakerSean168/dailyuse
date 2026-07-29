/**
 * PasswordAuthenticationProvider Tests
 *
 * Confirms the password provider delegates to the existing verification path
 * and adapts the result to the pluggable AuthenticationResult shape without
 * changing behavior (invalid credentials still surface as domain errors).
 */
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { PasswordAuthenticationProvider } from '../providers/password-authentication.provider';
import { AuthenticationMethod } from '../authentication-provider';
import { InvalidPasswordError, UserNotFoundError } from '../login';
import { AuthIdentity } from '../../aggregates/auth-identity';
import type { IAuthIdentityRepository } from '../../repositories/i-auth-identity.repository';
import type { IPasswordHasher } from '../i-password-hasher.service';
import type { ExecutionContext } from '@memoflow/contracts/shared';

const MOCK_HASH = '$argon2id$v=19$m=65536,t=3,p=4$bW9ja3NhbHQ$bW9ja2hhc2h2YWx1ZQ';

const createMockHasher = (compareResult = true): IPasswordHasher => ({
  hash: vi.fn().mockResolvedValue(MOCK_HASH),
  compare: vi.fn().mockResolvedValue(compareResult),
});

const createMockIdentityRepo = (
  overrides: Partial<IAuthIdentityRepository> = {},
): IAuthIdentityRepository => ({
  save: vi.fn().mockResolvedValue(undefined),
  findById: vi.fn().mockResolvedValue(null),
  findByEmail: vi.fn().mockResolvedValue(null),
  findByOAuth: vi.fn().mockResolvedValue(null),
  existsByEmail: vi.fn().mockResolvedValue(false),
  delete: vi.fn().mockResolvedValue(undefined),
  ...overrides,
});

const context = { deviceId: 'device-1', cx: {} as ExecutionContext };

describe('PasswordAuthenticationProvider', () => {
  let hasher: IPasswordHasher;
  let repo: IAuthIdentityRepository;

  beforeEach(() => {
    hasher = createMockHasher(true);
    repo = createMockIdentityRepo();
  });

  it('exposes the password method id', () => {
    const provider = new PasswordAuthenticationProvider(repo, hasher);
    expect(provider.method).toBe(AuthenticationMethod.Password);
  });

  it('resolves a verified identity for valid credentials', async () => {
    const identity = await AuthIdentity.createWithEmailAndPassword({
      email: 'user@example.com',
      plainPassword: 'StrongP@ss1',
      hasher,
    });
    (repo.findByEmail as ReturnType<typeof vi.fn>).mockResolvedValue(identity);

    const provider = new PasswordAuthenticationProvider(repo, hasher);
    const result = await provider.authenticate(
      { email: 'user@example.com', password: 'StrongP@ss1' },
      context,
    );

    expect(result.identity).toBe(identity);
    expect(result.isNewIdentity).toBe(false);
  });

  it('propagates UserNotFoundError when the email is unknown', async () => {
    const provider = new PasswordAuthenticationProvider(repo, hasher);

    await expect(
      provider.authenticate({ email: 'nobody@example.com', password: 'x' }, context),
    ).rejects.toBeInstanceOf(UserNotFoundError);
  });

  it('propagates InvalidPasswordError when the password is wrong', async () => {
    hasher = createMockHasher(false);
    const identity = await AuthIdentity.createWithEmailAndPassword({
      email: 'user@example.com',
      plainPassword: 'StrongP@ss1',
      hasher: createMockHasher(true),
    });
    repo = createMockIdentityRepo({
      findByEmail: vi.fn().mockResolvedValue(identity),
    });

    const provider = new PasswordAuthenticationProvider(repo, hasher);

    await expect(
      provider.authenticate({ email: 'user@example.com', password: 'wrong' }, context),
    ).rejects.toBeInstanceOf(InvalidPasswordError);
  });
});
