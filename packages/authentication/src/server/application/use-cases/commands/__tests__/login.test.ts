/**
 * Login Application Command Tests
 *
 * Tests for the Login use case which orchestrates:
 * - Domain LoginService for credential verification
 * - AuthSession creation with tokens
 * - Session persistence
 * - Response DTO assembly
 */
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { LoginUseCase } from '../login.use-case';
import { AuthIdentity } from '@/server/domain/aggregates/auth-identity';
import { AuthSession } from '@/server/domain/aggregates/auth-session';
import type { IAuthIdentityRepository } from '@/server/domain/repositories/i-auth-identity.repository';
import type { IAuthSessionRepository } from '@/server/domain/repositories/i-auth-session.repository';
import type { IPasswordHasher } from '@/server/domain';
import type { ITokenProvider } from '@/server/domain/services/token-provider.interface';
import type { ExecutionContext } from '@dailyuse/contracts/shared';

// ---------------------------------------------------------------------------
// Shared mock helpers
// ---------------------------------------------------------------------------

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

const createMockSessionRepo = (
  overrides: Partial<IAuthSessionRepository> = {},
): IAuthSessionRepository => ({
  save: vi.fn().mockResolvedValue(undefined),
  findById: vi.fn().mockResolvedValue(null),
  findByIdentityId: vi.fn().mockResolvedValue([]),
  remove: vi.fn().mockResolvedValue(undefined),
  removeAllByIdentityId: vi.fn().mockResolvedValue(undefined),
  removeExpired: vi.fn().mockResolvedValue(undefined),
  ...overrides,
});

const createMockTokenProvider = (): ITokenProvider => ({
  generateAccessToken: vi.fn().mockReturnValue('mock-access-token'),
  generateRefreshToken: vi.fn().mockReturnValue('mock-refresh-token'),
  verifyAccessToken: vi.fn().mockReturnValue({ ok: true, value: {} }),
  verifyRefreshToken: vi.fn().mockReturnValue({ ok: true, value: {} }),
  generateAuthTokens: vi.fn().mockReturnValue({
    accessToken: 'mock-access-token',
    refreshToken: 'mock-refresh-token',
    expiresIn: 900,
  }),
  hash: vi.fn().mockReturnValue('mock-token-hash'),
});

function createContext(identityId = 'test-identity-id'): ExecutionContext {
  return { identityId };
}

const MOCK_DEVICE_ID = 'test-device-001';

async function buildIdentity(
  email = 'test@example.com',
  hasher?: IPasswordHasher,
): Promise<AuthIdentity> {
  return AuthIdentity.createWithEmailAndPassword({
    email,
    plainPassword: 'StrongP@ss1',
    hasher: hasher ?? createMockHasher(),
  });
}

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

describe('Login (Application Command)', () => {
  let identityRepo: IAuthIdentityRepository;
  let sessionRepo: IAuthSessionRepository;
  let passwordHasher: IPasswordHasher;
  let tokenProvider: ITokenProvider;
  let useCase: LoginUseCase;

  beforeEach(() => {
    passwordHasher = createMockHasher(true);
    identityRepo = createMockIdentityRepo();
    sessionRepo = createMockSessionRepo();
    tokenProvider = createMockTokenProvider();
    useCase = new LoginUseCase(identityRepo, sessionRepo, passwordHasher, tokenProvider);
  });

  describe('execute', () => {
    it('should return ok with auth response on successful login', async () => {
      const identity = await buildIdentity('user@example.com', passwordHasher);
      (identityRepo.findByEmail as ReturnType<typeof vi.fn>).mockResolvedValue(identity);

      const result = await useCase.execute(
        { email: 'user@example.com', password: 'StrongP@ss1' },
        createContext(),
        MOCK_DEVICE_ID,
      );

      expect(result.ok).toBe(true);
      if (!result.ok) throw new Error('Expected ok result');
      expect(result.data.accessToken).toBe('mock-access-token');
      expect(result.data.refreshToken).toBe('mock-refresh-token');
      expect(result.data.identity).toBeDefined();
      expect(result.data.identity.id).toBe(identity.id);
      expect(result.data.session).toBeDefined();
    });

    it('should create and save a new session', async () => {
      const identity = await buildIdentity('user@example.com', passwordHasher);
      (identityRepo.findByEmail as ReturnType<typeof vi.fn>).mockResolvedValue(identity);

      await useCase.execute(
        { email: 'user@example.com', password: 'StrongP@ss1' },
        createContext(),
        MOCK_DEVICE_ID,
      );

      expect(sessionRepo.save).toHaveBeenCalledTimes(1);
      const savedSession = (sessionRepo.save as ReturnType<typeof vi.fn>).mock.calls[0][0];
      expect(savedSession).toBeDefined();
      expect(savedSession.identityId).toBe(identity.id);
    });

    it('should use token provider to generate auth tokens', async () => {
      const identity = await buildIdentity('user@example.com', passwordHasher);
      (identityRepo.findByEmail as ReturnType<typeof vi.fn>).mockResolvedValue(identity);

      await useCase.execute(
        { email: 'user@example.com', password: 'StrongP@ss1' },
        createContext(),
        MOCK_DEVICE_ID,
      );

      expect(tokenProvider.generateAuthTokens).toHaveBeenCalled();
    });

    it('should return UNAUTHORIZED error when user not found', async () => {
      (identityRepo.findByEmail as ReturnType<typeof vi.fn>).mockResolvedValue(null);

      const result = await useCase.execute(
        { email: 'ghost@example.com', password: 'any' },
        createContext(),
        MOCK_DEVICE_ID,
      );

      expect(result.ok).toBe(false);
      if (result.ok) throw new Error('Expected failure result');
      expect(result.error.code).toBe('UNAUTHORIZED');
      expect(result.error.message).toBe('Invalid email or password');
    });

    it('should return UNAUTHORIZED error when password is invalid', async () => {
      const identity = await buildIdentity('user@example.com');
      const badHasher = createMockHasher(false);
      const uc = new LoginUseCase(
        createMockIdentityRepo({
          findByEmail: vi.fn().mockResolvedValue(identity),
        }),
        sessionRepo,
        badHasher,
        tokenProvider,
      );

      const result = await uc.execute(
        { email: 'user@example.com', password: 'bad' },
        createContext(),
        MOCK_DEVICE_ID,
      );

      expect(result.ok).toBe(false);
      if (result.ok) throw new Error('Expected failure result');
      expect(result.error.code).toBe('UNAUTHORIZED');
      expect(result.error.message).toBe('Invalid email or password');
    });

    it('should return session marked as current session', async () => {
      const identity = await buildIdentity('user@example.com', passwordHasher);
      (identityRepo.findByEmail as ReturnType<typeof vi.fn>).mockResolvedValue(identity);

      const result = await useCase.execute(
        { email: 'user@example.com', password: 'StrongP@ss1' },
        createContext(),
        MOCK_DEVICE_ID,
      );

      expect(result.ok).toBe(true);
      if (!result.ok) throw new Error('Expected ok result');
      expect(result.data.session.isCurrentSession).toBe(true);
    });

    it('should persist identity after successful login', async () => {
      const identity = await buildIdentity('user@example.com', passwordHasher);
      (identityRepo.findByEmail as ReturnType<typeof vi.fn>).mockResolvedValue(identity);

      await useCase.execute(
        { email: 'user@example.com', password: 'StrongP@ss1' },
        createContext(),
        MOCK_DEVICE_ID,
      );

      expect(identityRepo.save).toHaveBeenCalledWith(identity);
    });
  });

  it('rejects disabled identities as invalid credentials', async () => {
    const identity = await AuthIdentity.createWithEmailAndPassword({
      email: 'closed@example.com',
      plainPassword: 'StrongP@ss1',
      hasher: passwordHasher,
    });
    identity.disable();
    (identityRepo.findByEmail as ReturnType<typeof vi.fn>).mockResolvedValue(identity);

    const result = await useCase.execute(
      { email: 'closed@example.com', password: 'StrongP@ss1' },
      { identityId: String(identity.id) } as any,
      'device-1',
    );

    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.error.code).toBe('UNAUTHORIZED');
    }
  });

});
