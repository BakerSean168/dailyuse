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
import { Login } from '../login';
import { AuthIdentity } from '@/domain-server/aggregates/auth-identity';
import { AuthSession } from '@/domain-server/aggregates/auth-session';
import type { IAuthIdentityRepository } from '@/domain-server/repositories/i-auth-identity.repository';
import type { IAuthSessionRepository } from '@/domain-server/repositories/i-auth-session.repository';
import type { IPasswordHasher } from '@/domain-shared';
import type { ITokenProvider } from '@/domain-server/services/token-provider.interface';
import type { Context } from '@dailyuse/contracts/shared';

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
  findByPhone: vi.fn().mockResolvedValue(null),
  findByOAuth: vi.fn().mockResolvedValue(null),
  existsByEmail: vi.fn().mockResolvedValue(false),
  existsByPhone: vi.fn().mockResolvedValue(false),
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

function createContext(identityId = 'test-identity-id'): Context {
  return { identityId, deviceId: 'test-device-001' };
}

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
  let useCase: Login;

  beforeEach(() => {
    passwordHasher = createMockHasher(true);
    identityRepo = createMockIdentityRepo();
    sessionRepo = createMockSessionRepo();
    tokenProvider = createMockTokenProvider();
    useCase = new Login(identityRepo, sessionRepo, passwordHasher, tokenProvider);
  });

  describe('execute', () => {
    it('should return auth response on successful login', async () => {
      const identity = await buildIdentity('user@example.com', passwordHasher);
      (identityRepo.findByEmail as ReturnType<typeof vi.fn>).mockResolvedValue(identity);

      const result = await useCase.execute(
        { email: 'user@example.com', password: 'StrongP@ss1' },
        createContext(),
      );

      expect(result).toBeDefined();
      expect(result.accessToken).toBe('mock-access-token');
      expect(result.refreshToken).toBe('mock-refresh-token');
      expect(result.identity).toBeDefined();
      expect(result.identity.id).toBe(identity.id);
      expect(result.session).toBeDefined();
    });

    it('should create and save a new session', async () => {
      const identity = await buildIdentity('user@example.com', passwordHasher);
      (identityRepo.findByEmail as ReturnType<typeof vi.fn>).mockResolvedValue(identity);

      await useCase.execute(
        { email: 'user@example.com', password: 'StrongP@ss1' },
        createContext(),
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
      );

      expect(tokenProvider.generateAuthTokens).toHaveBeenCalled();
    });

    it('should propagate UserNotFoundError from domain service', async () => {
      (identityRepo.findByEmail as ReturnType<typeof vi.fn>).mockResolvedValue(null);

      await expect(
        useCase.execute({ email: 'ghost@example.com', password: 'any' }, createContext()),
      ).rejects.toThrow('not found');
    });

    it('should propagate InvalidPasswordError from domain service', async () => {
      const identity = await buildIdentity('user@example.com');
      const badHasher = createMockHasher(false);
      const uc = new Login(
        createMockIdentityRepo({
          findByEmail: vi.fn().mockResolvedValue(identity),
        }),
        sessionRepo,
        badHasher,
        tokenProvider,
      );

      await expect(
        uc.execute({ email: 'user@example.com', password: 'bad' }, createContext()),
      ).rejects.toThrow('Invalid password');
    });

    it('should return session marked as current session', async () => {
      const identity = await buildIdentity('user@example.com', passwordHasher);
      (identityRepo.findByEmail as ReturnType<typeof vi.fn>).mockResolvedValue(identity);

      const result = await useCase.execute(
        { email: 'user@example.com', password: 'StrongP@ss1' },
        createContext(),
      );

      expect(result.session.isCurrentSession).toBe(true);
    });

    it('should persist identity after successful login', async () => {
      const identity = await buildIdentity('user@example.com', passwordHasher);
      (identityRepo.findByEmail as ReturnType<typeof vi.fn>).mockResolvedValue(identity);

      await useCase.execute(
        { email: 'user@example.com', password: 'StrongP@ss1' },
        createContext(),
      );

      expect(identityRepo.save).toHaveBeenCalledWith(identity);
    });
  });
});
