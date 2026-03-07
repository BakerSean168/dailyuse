/**
 * Register Application Command Tests
 *
 * Tests for the Register use case which orchestrates:
 * - Domain RegistrationService for identity creation
 * - AuthSession creation with tokens
 * - Session persistence
 * - Response DTO assembly
 */
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { Register } from '../register';
import type { IAuthIdentityRepository } from '@/domain-server/repositories/i-auth-identity.repository';
import type { IAuthSessionRepository } from '@/domain-server/repositories/i-auth-session.repository';
import type { IPasswordHasher } from '@/domain-shared';
import type { ITokenProvider } from '@/domain-server/services/token-provider.interface';
import type { Context } from '@dailyuse/contracts/shared';

// ---------------------------------------------------------------------------
// Shared mock helpers
// ---------------------------------------------------------------------------

const MOCK_HASH = '$argon2id$v=19$m=65536,t=3,p=4$bW9ja3NhbHQ$bW9ja2hhc2h2YWx1ZQ';

const createMockHasher = (): IPasswordHasher => ({
  hash: vi.fn().mockResolvedValue(MOCK_HASH),
  compare: vi.fn().mockResolvedValue(true),
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

function createContext(): Context {
  return { identityId: 'test-identity-id', deviceId: 'test-device-001' };
}

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

describe('Register (Application Command)', () => {
  let identityRepo: IAuthIdentityRepository;
  let sessionRepo: IAuthSessionRepository;
  let passwordHasher: IPasswordHasher;
  let tokenProvider: ITokenProvider;
  let useCase: Register;

  beforeEach(() => {
    passwordHasher = createMockHasher();
    identityRepo = createMockIdentityRepo();
    sessionRepo = createMockSessionRepo();
    tokenProvider = createMockTokenProvider();
    useCase = new Register(identityRepo, sessionRepo, passwordHasher, tokenProvider);
  });

  describe('execute', () => {
    it('should return auth response on successful registration', async () => {
      const result = await useCase.execute(
        { email: 'new@example.com', password: 'StrongP@ss1' },
        createContext(),
      );

      expect(result).toBeDefined();
      expect(result.accessToken).toBe('mock-access-token');
      expect(result.refreshToken).toBe('mock-refresh-token');
      expect(result.identity).toBeDefined();
      expect(result.session).toBeDefined();
    });

    it('should persist the new identity', async () => {
      await useCase.execute({ email: 'new@example.com', password: 'StrongP@ss1' }, createContext());

      expect(identityRepo.save).toHaveBeenCalledTimes(1);
    });

    it('should create and save a new session', async () => {
      await useCase.execute({ email: 'new@example.com', password: 'StrongP@ss1' }, createContext());

      expect(sessionRepo.save).toHaveBeenCalledTimes(1);
      const savedSession = (sessionRepo.save as ReturnType<typeof vi.fn>).mock.calls[0][0];
      expect(savedSession).toBeDefined();
    });

    it('should check email uniqueness', async () => {
      await useCase.execute({ email: 'new@example.com', password: 'StrongP@ss1' }, createContext());

      expect(identityRepo.existsByEmail).toHaveBeenCalledWith('new@example.com');
    });

    it('should throw when email already exists', async () => {
      const uc = new Register(
        createMockIdentityRepo({
          existsByEmail: vi.fn().mockResolvedValue(true),
        }),
        sessionRepo,
        passwordHasher,
        tokenProvider,
      );

      await expect(
        uc.execute({ email: 'taken@example.com', password: 'StrongP@ss1' }, createContext()),
      ).rejects.toThrow('already exists');
    });

    it('should use token provider for auth tokens', async () => {
      await useCase.execute({ email: 'new@example.com', password: 'StrongP@ss1' }, createContext());

      expect(tokenProvider.generateAuthTokens).toHaveBeenCalled();
    });

    it('should hash the password during registration', async () => {
      await useCase.execute({ email: 'new@example.com', password: 'StrongP@ss1' }, createContext());

      expect(passwordHasher.hash).toHaveBeenCalled();
    });

    it('should return identity with correct email', async () => {
      const result = await useCase.execute(
        { email: 'new@example.com', password: 'StrongP@ss1' },
        createContext(),
      );

      expect(result.identity.identifiers).toHaveLength(1);
      expect(result.identity.identifiers[0].type).toBe('Email');
    });

    it('should return session marked as current', async () => {
      const result = await useCase.execute(
        { email: 'new@example.com', password: 'StrongP@ss1' },
        createContext(),
      );

      expect(result.session.isCurrentSession).toBe(true);
    });

    it('should not save session when identity creation fails', async () => {
      const uc = new Register(
        createMockIdentityRepo({
          existsByEmail: vi.fn().mockResolvedValue(true),
        }),
        sessionRepo,
        passwordHasher,
        tokenProvider,
      );

      await expect(
        uc.execute({ email: 'taken@example.com', password: 'StrongP@ss1' }, createContext()),
      ).rejects.toThrow();

      expect(sessionRepo.save).not.toHaveBeenCalled();
    });
  });
});
