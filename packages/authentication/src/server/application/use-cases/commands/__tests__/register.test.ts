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
import { RegisterUseCase } from '../register.use-case';
import type { IAuthIdentityRepository } from '../../../../domain/repositories/i-auth-identity.repository';
import type { IAuthSessionRepository } from '../../../../domain/repositories/i-auth-session.repository';
import type { IPasswordHasher } from '../../../../domain';
import type { ITokenProvider } from '../../../../domain/services/token-provider.interface';
import type { ExecutionContext } from '@memoflow/contracts/shared';

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
  findByIdForIdentity: vi.fn().mockResolvedValue(null),
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

function createContext(): ExecutionContext {
  return { identityId: 'test-identity-id' };
}

const MOCK_DEVICE_ID = 'test-device-001';

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

describe('Register (Application Command)', () => {
  let identityRepo: IAuthIdentityRepository;
  let sessionRepo: IAuthSessionRepository;
  let passwordHasher: IPasswordHasher;
  let tokenProvider: ITokenProvider;
  let useCase: RegisterUseCase;

  beforeEach(() => {
    passwordHasher = createMockHasher();
    identityRepo = createMockIdentityRepo();
    sessionRepo = createMockSessionRepo();
    tokenProvider = createMockTokenProvider();
    useCase = new RegisterUseCase(identityRepo, sessionRepo, passwordHasher, tokenProvider);
  });

  describe('execute', () => {
    it('should return ok with auth response on successful registration', async () => {
      const result = await useCase.execute(
        { email: 'new@example.com', password: 'StrongP@ss1' },
        createContext(),
        MOCK_DEVICE_ID,
      );

      expect(result.ok).toBe(true);
      if (!result.ok) throw new Error('Expected ok result');
      expect(result.data.accessToken).toBe('mock-access-token');
      expect(result.data.refreshToken).toBe('mock-refresh-token');
      expect(result.data.identity).toBeDefined();
      expect(result.data.session).toBeDefined();
    });

    it('should persist the new identity', async () => {
      await useCase.execute({ email: 'new@example.com', password: 'StrongP@ss1' }, createContext(), MOCK_DEVICE_ID);

      expect(identityRepo.save).toHaveBeenCalledTimes(1);
    });

    it('should create and save a new session', async () => {
      await useCase.execute({ email: 'new@example.com', password: 'StrongP@ss1' }, createContext(), MOCK_DEVICE_ID);

      expect(sessionRepo.save).toHaveBeenCalledTimes(1);
      const savedSession = (sessionRepo.save as ReturnType<typeof vi.fn>).mock.calls[0][0];
      expect(savedSession).toBeDefined();
    });

    it('should check email uniqueness', async () => {
      await useCase.execute({ email: 'new@example.com', password: 'StrongP@ss1' }, createContext(), MOCK_DEVICE_ID);

      expect(identityRepo.existsByEmail).toHaveBeenCalledWith('new@example.com');
    });

    it('should return CONFLICT error when email already exists', async () => {
      const uc = new RegisterUseCase(
        createMockIdentityRepo({
          existsByEmail: vi.fn().mockResolvedValue(true),
        }),
        sessionRepo,
        passwordHasher,
        tokenProvider,
      );

      const result = await uc.execute(
        { email: 'taken@example.com', password: 'StrongP@ss1' },
        createContext(),
        MOCK_DEVICE_ID,
      );

      expect(result.ok).toBe(false);
      if (result.ok) throw new Error('Expected failure result');
      expect(result.error.code).toBe('CONFLICT');
    });

    it('should use token provider for auth tokens', async () => {
      await useCase.execute({ email: 'new@example.com', password: 'StrongP@ss1' }, createContext(), MOCK_DEVICE_ID);

      expect(tokenProvider.generateAuthTokens).toHaveBeenCalled();
    });

    it('should hash the password during registration', async () => {
      await useCase.execute({ email: 'new@example.com', password: 'StrongP@ss1' }, createContext(), MOCK_DEVICE_ID);

      expect(passwordHasher.hash).toHaveBeenCalled();
    });

    it('should return identity with correct email', async () => {
      const result = await useCase.execute(
        { email: 'new@example.com', password: 'StrongP@ss1' },
        createContext(),
        MOCK_DEVICE_ID,
      );

      expect(result.ok).toBe(true);
      if (!result.ok) throw new Error('Expected ok result');
      expect(result.data.identity.identifiers).toHaveLength(1);
      expect(result.data.identity.identifiers[0].type).toBe('Email');
    });

    it('should return session marked as current', async () => {
      const result = await useCase.execute(
        { email: 'new@example.com', password: 'StrongP@ss1' },
        createContext(),
        MOCK_DEVICE_ID,
      );

      expect(result.ok).toBe(true);
      if (!result.ok) throw new Error('Expected ok result');
      expect(result.data.session.isCurrentSession).toBe(true);
    });

    it('should not save session when identity creation fails', async () => {
      const uc = new RegisterUseCase(
        createMockIdentityRepo({
          existsByEmail: vi.fn().mockResolvedValue(true),
        }),
        sessionRepo,
        passwordHasher,
        tokenProvider,
      );

      const result = await uc.execute(
        { email: 'taken@example.com', password: 'StrongP@ss1' },
        createContext(),
        MOCK_DEVICE_ID,
      );

      expect(result.ok).toBe(false);
      expect(sessionRepo.save).not.toHaveBeenCalled();
    });
  });
});
