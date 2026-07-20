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
import { RefreshTokenUseCase } from '../refresh-token.use-case';
import { AuthSession } from '@/server/domain/aggregates/auth-session';
import { AuthIdentity } from '@/server/domain/aggregates/auth-identity';
import type { IAuthIdentityRepository } from '@/server/domain/repositories/i-auth-identity.repository';
import type { IAuthSessionRepository } from '@/server/domain/repositories/i-auth-session.repository';
import type { IPasswordHasher } from '@/server/domain';
import type { ITokenProvider } from '@/server/domain/services/token-provider.interface';
import type { ExecutionContext } from '@dailyuse/contracts/shared';
import { AuthSessionId, SessionStatus, DeviceInfo } from '@/server/domain';
import { IdentityId } from '@dailyuse/domain-shared/shared';
import { REFRESH_TOKEN_DURATION_MS } from '@/server/domain/aggregates/auth-session';

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

function createContext(identityId = 'IdentityId_550e8400-e29b-41d4-a716-446655440001'): ExecutionContext {
  return { identityId };
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
    status: SessionStatus.Active,
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
  let useCase: RefreshTokenUseCase;

  beforeEach(() => {
    tokenProvider = createMockTokenProvider('matching-hash');
    identityRepo = createMockIdentityRepo();
    sessionRepo = createMockSessionRepo();
    useCase = new RefreshTokenUseCase(sessionRepo, identityRepo, tokenProvider);
  });

  describe('execute', () => {
    it('should return ok with new auth tokens on successful refresh', async () => {
      const identityId = IdentityId.of('IdentityId_550e8400-e29b-41d4-a716-446655440001');
      const session = buildActiveSession(identityId, 'matching-hash');
      const identity = await buildIdentity();

      setTokenPayload(tokenProvider, identityId, session.id);
      (sessionRepo.findById as ReturnType<typeof vi.fn>).mockResolvedValue(session);
      (identityRepo.findById as ReturnType<typeof vi.fn>).mockResolvedValue(identity);

      const result = await useCase.execute(
        { refreshToken: 'old-refresh-token' },
        createContext(identityId),
      );

      expect(result.ok).toBe(true);
      if (!result.ok) throw new Error('Expected ok result');
      expect(result.data.accessToken).toBe('new-access-token');
      expect(result.data.refreshToken).toBe('new-refresh-token');
      expect(result.data.identity).toBeDefined();
      expect(result.data.session).toBeDefined();
    });

    it('should update the session refresh token hash', async () => {
      const identityId = IdentityId.of('IdentityId_550e8400-e29b-41d4-a716-446655440001');
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

    it('should return UNAUTHORIZED error when no matching session found', async () => {
      const identityId = IdentityId.of('IdentityId_550e8400-e29b-41d4-a716-446655440001');
      // No sessions at all
      setTokenPayload(tokenProvider, identityId, AuthSessionId.generate());
      (sessionRepo.findById as ReturnType<typeof vi.fn>).mockResolvedValue(null);

      const result = await useCase.execute(
        { refreshToken: 'invalid-token' },
        createContext(identityId),
      );

      expect(result.ok).toBe(false);
      if (result.ok) throw new Error('Expected failure result');
      expect(result.error.code).toBe('UNAUTHORIZED');
      expect(result.error.message).toBe('Invalid refresh token or session expired');
    });

    it('should treat hash mismatch on an active session as refresh-token reuse', async () => {
      const identityId = IdentityId.of('IdentityId_550e8400-e29b-41d4-a716-446655440001');
      // Session has a different hash while remaining valid → reuse / theft signal.
      const session = buildActiveSession(identityId, 'different-hash');

      setTokenPayload(tokenProvider, identityId, session.id);
      (sessionRepo.findById as ReturnType<typeof vi.fn>).mockResolvedValue(session);

      const result = await useCase.execute(
        { refreshToken: 'token-with-wrong-hash' },
        createContext(identityId),
      );

      expect(result.ok).toBe(false);
      if (result.ok) throw new Error('Expected failure result');
      expect(result.error.code).toBe('UNAUTHORIZED');
      expect(result.error.message).toContain('reuse');
      expect(sessionRepo.removeAllByIdentityId).toHaveBeenCalledWith(session.identityId);
    });

    it('should return UNAUTHORIZED error when session is expired', async () => {
      const identityId = IdentityId.of('IdentityId_550e8400-e29b-41d4-a716-446655440001');
      const expiredSession = AuthSession.load({
        id: AuthSessionId.generate(),
        identityId,
        deviceInfo: DeviceInfo.createDefault('test-device'),
        refreshTokenHash: 'matching-hash',
        status: SessionStatus.Active,
        createdAt: new Date(Date.now() - 2 * REFRESH_TOKEN_DURATION_MS),
        expiresAt: new Date(Date.now() - 1000), // expired
        lastActiveAt: new Date(Date.now() - REFRESH_TOKEN_DURATION_MS),
        isRevoked: false,
      });

      setTokenPayload(tokenProvider, identityId, expiredSession.id);
      (sessionRepo.findById as ReturnType<typeof vi.fn>).mockResolvedValue(expiredSession);

      const result = await useCase.execute(
        { refreshToken: 'old-refresh-token' },
        createContext(identityId),
      );

      expect(result.ok).toBe(false);
      if (result.ok) throw new Error('Expected failure result');
      expect(result.error.code).toBe('UNAUTHORIZED');
      expect(result.error.message).toBe('Invalid refresh token or session expired');
    });

    it('should return UNAUTHORIZED error when session is revoked', async () => {
      const identityId = IdentityId.of('IdentityId_550e8400-e29b-41d4-a716-446655440001');
      const revokedSession = AuthSession.load({
        id: AuthSessionId.generate(),
        identityId,
        deviceInfo: DeviceInfo.createDefault('test-device'),
        refreshTokenHash: 'matching-hash',
        status: SessionStatus.Revoked,
        createdAt: new Date(),
        expiresAt: new Date(Date.now() + REFRESH_TOKEN_DURATION_MS),
        lastActiveAt: new Date(),
        isRevoked: true,
      });

      setTokenPayload(tokenProvider, identityId, revokedSession.id);
      (sessionRepo.findById as ReturnType<typeof vi.fn>).mockResolvedValue(revokedSession);

      const result = await useCase.execute(
        { refreshToken: 'old-refresh-token' },
        createContext(identityId),
      );

      expect(result.ok).toBe(false);
      if (result.ok) throw new Error('Expected failure result');
      expect(result.error.code).toBe('UNAUTHORIZED');
      expect(result.error.message).toBe('Invalid refresh token or session expired');
    });

    it('should return NOT_FOUND error when identity not found after session match', async () => {
      const identityId = IdentityId.of('IdentityId_550e8400-e29b-41d4-a716-446655440001');
      const session = buildActiveSession(identityId, 'matching-hash');

      setTokenPayload(tokenProvider, identityId, session.id);
      (sessionRepo.findById as ReturnType<typeof vi.fn>).mockResolvedValue(session);
      (identityRepo.findById as ReturnType<typeof vi.fn>).mockResolvedValue(null);

      const result = await useCase.execute(
        { refreshToken: 'old-refresh-token' },
        createContext(identityId),
      );

      expect(result.ok).toBe(false);
      if (result.ok) throw new Error('Expected failure result');
      expect(result.error.code).toBe('NOT_FOUND');
      expect(result.error.message).toBe('Identity not found');
    });

    it('should generate new auth tokens via token provider', async () => {
      const identityId = IdentityId.of('IdentityId_550e8400-e29b-41d4-a716-446655440001');
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
      const identityId = IdentityId.of('IdentityId_550e8400-e29b-41d4-a716-446655440001');
      const session = buildActiveSession(identityId, 'matching-hash');
      const identity = await buildIdentity();

      setTokenPayload(tokenProvider, identityId, session.id);
      (sessionRepo.findById as ReturnType<typeof vi.fn>).mockResolvedValue(session);
      (identityRepo.findById as ReturnType<typeof vi.fn>).mockResolvedValue(identity);

      const result = await useCase.execute(
        { refreshToken: 'old-refresh-token' },
        createContext(identityId),
      );

      expect(result.ok).toBe(true);
      if (!result.ok) throw new Error('Expected ok result');
      expect(result.data.session.isCurrentSession).toBe(true);
    });

    it('should revoke all sessions when a rotated refresh token is reused', async () => {
      const identityId = IdentityId.of('IdentityId_550e8400-e29b-41d4-a716-446655440001');
      // Session already rotated to a new hash; replay presents the old hash.
      const session = buildActiveSession(identityId, 'current-rotated-hash');

      setTokenPayload(tokenProvider, identityId, session.id);
      (sessionRepo.findById as ReturnType<typeof vi.fn>).mockResolvedValue(session);
      // hash() for presented token returns the stale value
      (tokenProvider.hash as ReturnType<typeof vi.fn>).mockReturnValue('stale-previous-hash');

      const result = await useCase.execute(
        { refreshToken: 'stale-refresh-token' },
        createContext(String(identityId)),
      );

      expect(result.ok).toBe(false);
      if (result.ok) throw new Error('Expected failure result');
      expect(result.error.code).toBe('UNAUTHORIZED');
      expect(result.error.message).toContain('reuse');
      expect(sessionRepo.removeAllByIdentityId).toHaveBeenCalledWith(session.identityId);
      expect(sessionRepo.save).not.toHaveBeenCalled();
    });
  });
});
