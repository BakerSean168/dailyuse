/**
 * RefreshToken Application Command Tests
 *
 * Tests for the RefreshToken use case which orchestrates:
 * - Finding sessions for the identity
 * - Matching the refresh token hash
 * - Generating new token pair
 * - Updating session with new refresh token hash
 * - Returning updated auth response
 */
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { RefreshToken } from '../refresh-token';
import { AuthSession } from '@/domain-server/aggregates/auth-session';
import { AuthIdentity } from '@/domain-server/aggregates/auth-identity';
import type { IAuthIdentityRepository } from '@/domain-server/repositories/i-auth-identity.repository';
import type { IAuthSessionRepository } from '@/domain-server/repositories/i-auth-session.repository';
import type { IPasswordHasher } from '@/domain-shared';
import type { ITokenProvider } from '@/domain-server/services/token-provider.interface';
import type { Context } from '@dailyuse/contracts/shared';
import { AuthSessionId, SessionStatus, DeviceInfo } from '@/domain-shared';
import { IdentityId } from '@dailyuse/domain-shared/shared';
import { REFRESH_TOKEN_DURATION_MS } from '@/domain-server/aggregates/auth-session';

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

const createMockTokenProvider = (refreshTokenHashReturn = 'matching-hash'): ITokenProvider => ({
  generateAccessToken: vi.fn().mockReturnValue('new-access-token'),
  generateRefreshToken: vi.fn().mockReturnValue('new-refresh-token'),
  verifyAccessToken: vi.fn().mockReturnValue({ ok: true, data: {} }),
  verifyRefreshToken: vi.fn().mockReturnValue({ ok: true, data: {} }),
  generateAuthTokens: vi.fn().mockReturnValue({
    accessToken: 'new-access-token',
    refreshToken: 'new-refresh-token',
    expiresIn: 900,
  }),
  hash: vi.fn().mockReturnValue(refreshTokenHashReturn),
});

function setTokenPayload(
  provider: ITokenProvider,
  identityId: IdentityId,
  sessionId: AuthSessionId,
): void {
  (provider.verifyRefreshToken as ReturnType<typeof vi.fn>).mockReturnValue({
    ok: true,
    data: { identityId, sessionId },
  });
}

function createContext(identityId = 'IdentityId_test-user-001'): Context {
  return { identityId, deviceId: 'test-device-001' };
}

function buildActiveSession(
  identityId: IdentityId,
  refreshTokenHash = 'matching-hash',
): AuthSession {
  return AuthSession.load({
    id: AuthSessionId.generate(),
    identityId,
    deviceInfo: DeviceInfo.createDefault('test-device'),
    refreshTokenHash,
    status: SessionStatus.ACTIVE,
    createdAt: new Date(),
    expiresAt: new Date(Date.now() + REFRESH_TOKEN_DURATION_MS),
    lastActiveAt: new Date(Date.now() - 2 * 60 * 60 * 1000), // 2 hours ago, past sliding window
    isRevoked: false,
  });
}

async function buildIdentity(email = 'test@example.com'): Promise<AuthIdentity> {
  return AuthIdentity.createWithEmailAndPassword({
    email,
    plainPassword: 'StrongP@ss1',
    hasher: createMockHasher(),
  });
}

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

describe('RefreshToken (Application Command)', () => {
  let identityRepo: IAuthIdentityRepository;
  let sessionRepo: IAuthSessionRepository;
  let tokenProvider: ITokenProvider;
  let useCase: RefreshToken;

  beforeEach(() => {
    tokenProvider = createMockTokenProvider('matching-hash');
    identityRepo = createMockIdentityRepo();
    sessionRepo = createMockSessionRepo();
    useCase = new RefreshToken(sessionRepo, identityRepo, tokenProvider);
  });

  describe('execute', () => {
    it('should return new auth tokens on successful refresh', async () => {
      const identityId = IdentityId.of('IdentityId_test-user-001');
      const session = buildActiveSession(identityId, 'matching-hash');
      const identity = await buildIdentity();

      setTokenPayload(tokenProvider, identityId, session.id);
      (sessionRepo.findById as ReturnType<typeof vi.fn>).mockResolvedValue(session);
      (identityRepo.findById as ReturnType<typeof vi.fn>).mockResolvedValue(identity);

      const result = await useCase.execute(
        { refreshToken: 'old-refresh-token' },
        createContext(identityId),
      );

      expect(result.accessToken).toBe('new-access-token');
      expect(result.refreshToken).toBe('new-refresh-token');
      expect(result.identity).toBeDefined();
      expect(result.session).toBeDefined();
    });

    it('should update the session refresh token hash', async () => {
      const identityId = IdentityId.of('IdentityId_test-user-001');
      const session = buildActiveSession(identityId, 'matching-hash');
      const identity = await buildIdentity();

      setTokenPayload(tokenProvider, identityId, session.id);
      (sessionRepo.findById as ReturnType<typeof vi.fn>).mockResolvedValue(session);
      (identityRepo.findById as ReturnType<typeof vi.fn>).mockResolvedValue(identity);

      await useCase.execute({ refreshToken: 'old-refresh-token' }, createContext(identityId));

      // token provider's hash is called for the new refresh token
      expect(tokenProvider.hash).toHaveBeenCalled();
      expect(sessionRepo.save).toHaveBeenCalledWith(session);
    });

    it('should throw when no matching session found', async () => {
      const identityId = IdentityId.of('IdentityId_test-user-001');
      // No sessions at all
      setTokenPayload(tokenProvider, identityId, AuthSessionId.generate());
      (sessionRepo.findById as ReturnType<typeof vi.fn>).mockResolvedValue(null);

      await expect(
        useCase.execute({ refreshToken: 'invalid-token' }, createContext(identityId)),
      ).rejects.toThrow('Invalid refresh token or session expired');
    });

    it('should throw when refresh token hash does not match', async () => {
      const identityId = IdentityId.of('IdentityId_test-user-001');
      // Session has a different hash
      const session = buildActiveSession(identityId, 'different-hash');

      setTokenPayload(tokenProvider, identityId, session.id);
      (sessionRepo.findById as ReturnType<typeof vi.fn>).mockResolvedValue(session);

      await expect(
        useCase.execute({ refreshToken: 'token-with-wrong-hash' }, createContext(identityId)),
      ).rejects.toThrow('Invalid refresh token or session expired');
    });

    it('should throw when session is expired', async () => {
      const identityId = IdentityId.of('IdentityId_test-user-001');
      const expiredSession = AuthSession.load({
        id: AuthSessionId.generate(),
        identityId,
        deviceInfo: DeviceInfo.createDefault('test-device'),
        refreshTokenHash: 'matching-hash',
        status: SessionStatus.ACTIVE,
        createdAt: new Date(Date.now() - 2 * REFRESH_TOKEN_DURATION_MS),
        expiresAt: new Date(Date.now() - 1000), // expired
        lastActiveAt: new Date(Date.now() - REFRESH_TOKEN_DURATION_MS),
        isRevoked: false,
      });

      setTokenPayload(tokenProvider, identityId, expiredSession.id);
      (sessionRepo.findById as ReturnType<typeof vi.fn>).mockResolvedValue(expiredSession);

      await expect(
        useCase.execute({ refreshToken: 'old-refresh-token' }, createContext(identityId)),
      ).rejects.toThrow('Invalid refresh token or session expired');
    });

    it('should throw when session is revoked', async () => {
      const identityId = IdentityId.of('IdentityId_test-user-001');
      const revokedSession = AuthSession.load({
        id: AuthSessionId.generate(),
        identityId,
        deviceInfo: DeviceInfo.createDefault('test-device'),
        refreshTokenHash: 'matching-hash',
        status: SessionStatus.REVOKED,
        createdAt: new Date(),
        expiresAt: new Date(Date.now() + REFRESH_TOKEN_DURATION_MS),
        lastActiveAt: new Date(),
        isRevoked: true,
      });

      setTokenPayload(tokenProvider, identityId, revokedSession.id);
      (sessionRepo.findById as ReturnType<typeof vi.fn>).mockResolvedValue(revokedSession);

      await expect(
        useCase.execute({ refreshToken: 'old-refresh-token' }, createContext(identityId)),
      ).rejects.toThrow('Invalid refresh token or session expired');
    });

    it('should throw when identity not found after session match', async () => {
      const identityId = IdentityId.of('IdentityId_test-user-001');
      const session = buildActiveSession(identityId, 'matching-hash');

      setTokenPayload(tokenProvider, identityId, session.id);
      (sessionRepo.findById as ReturnType<typeof vi.fn>).mockResolvedValue(session);
      (identityRepo.findById as ReturnType<typeof vi.fn>).mockResolvedValue(null);

      await expect(
        useCase.execute({ refreshToken: 'old-refresh-token' }, createContext(identityId)),
      ).rejects.toThrow('Identity not found');
    });

    it('should generate new auth tokens via token provider', async () => {
      const identityId = IdentityId.of('IdentityId_test-user-001');
      const session = buildActiveSession(identityId, 'matching-hash');
      const identity = await buildIdentity();

      setTokenPayload(tokenProvider, identityId, session.id);
      (sessionRepo.findById as ReturnType<typeof vi.fn>).mockResolvedValue(session);
      (identityRepo.findById as ReturnType<typeof vi.fn>).mockResolvedValue(identity);

      await useCase.execute({ refreshToken: 'old-refresh-token' }, createContext(identityId));

      expect(tokenProvider.generateAuthTokens).toHaveBeenCalledWith({
        identityId: session.identityId,
        sessionId: session.id,
      });
    });

    it('should return session marked as current session', async () => {
      const identityId = IdentityId.of('IdentityId_test-user-001');
      const session = buildActiveSession(identityId, 'matching-hash');
      const identity = await buildIdentity();

      setTokenPayload(tokenProvider, identityId, session.id);
      (sessionRepo.findById as ReturnType<typeof vi.fn>).mockResolvedValue(session);
      (identityRepo.findById as ReturnType<typeof vi.fn>).mockResolvedValue(identity);

      const result = await useCase.execute(
        { refreshToken: 'old-refresh-token' },
        createContext(identityId),
      );

      expect(result.session.isCurrentSession).toBe(true);
    });
  });
});
