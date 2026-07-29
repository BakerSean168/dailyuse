/**
 * AuthSession Aggregate Root Tests
 *
 * Tests for the AuthSession aggregate which manages:
 * - Session creation and lifecycle (active, expired, revoked)
 * - Token hash management
 * - Sliding window refresh (touch)
 * - Session extension
 * - Serialization to DTOs
 */
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { AuthSession, ACCESS_TOKEN_DURATION_MS, REFRESH_TOKEN_DURATION_MS } from '../auth-session';
import type { AuthSessionState } from '../auth-session';
import { SessionStatus, AuthSessionId, DeviceInfo } from '../..';
import { IdentityId } from '@memoflow/domain-shared/shared';
import type { ITokenProvider } from '../../services/token-provider.interface';

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function buildSessionState(overrides: Partial<AuthSessionState> = {}): AuthSessionState {
  const now = Date.now();
  const normalizeInstant = (value: unknown, fallback: number): number => {
    if (value == null) return fallback;
    if (typeof value === 'number') return value;
    if (value instanceof Date) return value.getTime();
    return Number(value);
  };
  const base = {
    id: AuthSessionId.generate(),
    identityId: IdentityId.generate(),
    deviceInfo: DeviceInfo.createDefault('test-device-001'),
    refreshTokenHash: 'hashed-refresh-token',
    status: SessionStatus.Active,
    version: 1,
    createdAt: now,
    expiresAt: now + REFRESH_TOKEN_DURATION_MS,
    lastActiveAt: now,
    isRevoked: false,
    ...overrides,
  };
  return {
    ...base,
    createdAt: normalizeInstant(base.createdAt, now),
    expiresAt: normalizeInstant(base.expiresAt, now + REFRESH_TOKEN_DURATION_MS),
    lastActiveAt: normalizeInstant(base.lastActiveAt, now),
  };
}

function buildActiveSession(overrides: Partial<AuthSessionState> = {}): AuthSession {
  return AuthSession.load(buildSessionState(overrides));
}

function createMockTokenProvider(): ITokenProvider {
  return {
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
  };
}

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

describe('AuthSession', () => {
  describe('create (factory)', () => {
    it('should create a new session with correct state', () => {
      const sessionId = AuthSessionId.generate();
      const identityId = IdentityId.generate();

      const session = AuthSession.create({
        id: sessionId,
        identityId,
        deviceInfo: DeviceInfo.createDefault('dev-1'),
        refreshTokenHash: 'hash-abc',
        expiresAt: Date.now() + REFRESH_TOKEN_DURATION_MS,
      });

      expect(session.id).toBe(sessionId);
      expect(session.identityId).toBe(identityId);
      expect(session.status).toBe('Active');
      expect(session.isRevoked).toBe(false);
      expect(session.refreshTokenHash).toBe('hash-abc');
      expect(session.version).toBe(1);
    });

    it('should emit session-created domain event', () => {
      const identityId = IdentityId.generate();

      const session = AuthSession.create({
        id: AuthSessionId.generate(),
        identityId,
        deviceInfo: DeviceInfo.createDefault('dev-1'),
        refreshTokenHash: 'hash-abc',
        expiresAt: Date.now() + REFRESH_TOKEN_DURATION_MS,
      });

      const events = session.domainEvents;
      expect(events.length).toBeGreaterThan(0);
      expect(events[0].eventType).toBe('auth:session-created');
      expect((events[0].payload as any).identityId).toBe(identityId);
    });
  });

  describe('start (factory)', () => {
    it('should create session with tokens from provider', () => {
      const identityId = IdentityId.generate();
      const tokenProvider = createMockTokenProvider();

      const { AuthSession: session, tokens } = AuthSession.start({
        identityId,
        deviceId: 'dev-1',
        tokenProvider,
      });

      expect(session).toBeDefined();
      expect(session.identityId).toBe(identityId);
      expect(session.status).toBe('Active');
      expect(tokens.accessToken).toBe('mock-access-token');
      expect(tokens.refreshToken).toBe('mock-refresh-token');
      expect(tokenProvider.generateAuthTokens).toHaveBeenCalled();
      expect(tokenProvider.hash).toHaveBeenCalledWith('mock-refresh-token');
    });
  });

  describe('load (factory)', () => {
    it('should restore session from persisted state', () => {
      const state = buildSessionState();
      const session = AuthSession.load(state);

      expect(session.id).toBe(state.id);
      expect(session.identityId).toBe(state.identityId);
      expect(session.status).toBe(state.status);
      expect(session.isRevoked).toBe(state.isRevoked);
    });

    it('should restore a revoked session', () => {
      const session = AuthSession.load(
        buildSessionState({ isRevoked: true, status: SessionStatus.Revoked }),
      );

      expect(session.isRevoked).toBe(true);
      expect(session.status).toBe('Revoked');
    });
  });

  describe('isValid', () => {
    it('should return true for active non-expired non-revoked session', () => {
      const session = buildActiveSession();
      expect(session.isValid()).toBe(true);
    });

    it('should return false for revoked session', () => {
      const session = buildActiveSession({ isRevoked: true });
      expect(session.isValid()).toBe(false);
    });

    it('should return false for expired session', () => {
      const session = buildActiveSession({
        expiresAt: new Date(Date.now() - 1000),
      });
      expect(session.isValid()).toBe(false);
    });

    it('should return false for non-active status', () => {
      const session = buildActiveSession({ status: SessionStatus.Expired });
      expect(session.isValid()).toBe(false);
    });
  });

  describe('isExpired', () => {
    it('should return false when expiry is in the future', () => {
      const session = buildActiveSession();
      expect(session.isExpired()).toBe(false);
    });

    it('should return true when expiry is in the past', () => {
      const session = buildActiveSession({
        expiresAt: new Date(Date.now() - 1000),
      });
      expect(session.isExpired()).toBe(true);
    });
  });

  describe('revoke', () => {
    it('should mark session as revoked', () => {
      const session = buildActiveSession();
      session.revoke();

      expect(session.isRevoked).toBe(true);
      expect(session.status).toBe('Revoked');
    });

    it('should emit session-revoked domain event', () => {
      const session = buildActiveSession();
      session.revoke();

      const revokedEvent = session.domainEvents.find((e) => e.eventType === 'auth:session-revoked');
      expect(revokedEvent).toBeDefined();
    });

    it('should be idempotent', () => {
      const session = buildActiveSession();
      session.revoke();
      const eventCount = session.domainEvents.length;

      session.revoke(); // second call should not add event
      expect(session.domainEvents.length).toBe(eventCount);
      expect(session.isRevoked).toBe(true);
    });
  });

  describe('markExpired', () => {
    it('should mark session status as Expired', () => {
      const session = buildActiveSession();
      session.markExpired();
      expect(session.status).toBe('Expired');
    });

    it('should be idempotent', () => {
      const session = buildActiveSession();
      session.markExpired();
      session.markExpired(); // no throw
      expect(session.status).toBe('Expired');
    });
  });

  describe('touch', () => {
    it('should return false for invalid session', () => {
      const session = buildActiveSession({ isRevoked: true });
      expect(session.touch()).toBe(false);
    });

    it('should return false when last active time is recent (within threshold)', () => {
      const session = buildActiveSession({
        lastActiveAt: new Date(), // just now
      });
      expect(session.touch()).toBe(false);
    });

    it('should return true and update lastActiveAt when past threshold', () => {
      // Create session with lastActiveAt > 1 hour ago
      const twoHoursAgo = new Date(Date.now() - 2 * 60 * 60 * 1000);
      const session = buildActiveSession({
        lastActiveAt: twoHoursAgo,
      });

      const result = session.touch();
      expect(result).toBe(true);
      expect(Number(session.lastActiveAt)).toBeGreaterThan(twoHoursAgo.getTime());
    });
  });

  describe('extend', () => {
    it('should extend the session expiry', () => {
      const session = buildActiveSession();
      const beforeExtend = Number(session.expiresAt);

      session.extend();

      expect(Number(session.expiresAt)).toBeGreaterThanOrEqual(beforeExtend);
    });

    it('should accept custom duration', () => {
      const session = buildActiveSession();
      const customDuration = 30 * 60 * 1000; // 30 minutes

      session.extend(customDuration);

      const expectedMin = Date.now() + customDuration - 1000;
      expect(Number(session.expiresAt)).toBeGreaterThanOrEqual(expectedMin);
    });

    it('should throw when extending an invalid session', () => {
      const session = buildActiveSession({ isRevoked: true });
      expect(() => session.extend()).toThrow('Cannot extend an invalid session');
    });
  });

  describe('updateRefreshTokenHash', () => {
    it('should update the refresh token hash', () => {
      const session = buildActiveSession();
      session.updateRefreshTokenHash('new-hash-value');
      expect(session.refreshTokenHash).toBe('new-hash-value');
    });

    it('should update lastActiveAt', () => {
      const oldTime = new Date(Date.now() - 10000);
      const session = buildActiveSession({ lastActiveAt: oldTime });

      session.updateRefreshTokenHash('new-hash');
      expect(Number(session.lastActiveAt)).toBeGreaterThan(oldTime.getTime());
    });

    it('should throw when session is invalid', () => {
      const session = buildActiveSession({ isRevoked: true });
      expect(() => session.updateRefreshTokenHash('new-hash')).toThrow(
        'Cannot update refresh token on an invalid session',
      );
    });
  });

  describe('getRemainingSeconds', () => {
    it('should return positive value for valid session', () => {
      const session = buildActiveSession();
      expect(session.getRemainingSeconds()).toBeGreaterThan(0);
    });

    it('should return 0 for invalid session', () => {
      const session = buildActiveSession({ isRevoked: true });
      expect(session.getRemainingSeconds()).toBe(0);
    });

    it('should return 0 for expired session', () => {
      const session = buildActiveSession({
        expiresAt: new Date(Date.now() - 1000),
      });
      expect(session.getRemainingSeconds()).toBe(0);
    });
  });

  describe('serialization', () => {
    it('should produce correct ServerDTO', () => {
      const session = buildActiveSession();
      const dto = session.toServerDTO();

      expect(dto.id).toBe(session.id);
      expect(dto.identityId).toBe(session.identityId);
      expect(dto.status).toBe('Active');
      expect(dto.version).toBe(session.version);
      expect(dto.isRevoked).toBe(false);
      expect(dto.refreshTokenHash).toBeDefined();
      expect(typeof dto.createdAt).toBe('number');
      expect(typeof dto.expiresAt).toBe('number');
      expect(typeof dto.lastActiveAt).toBe('number');
      expect(dto.deviceInfo).toBeDefined();
    });

    it('should produce correct ClientDTO', () => {
      const session = buildActiveSession();
      const dto = session.toClientDTO(true);

      expect(dto.id).toBe(session.id);
      expect(dto.identityId).toBe(session.identityId);
      expect(dto.isCurrentSession).toBe(true);
      expect(dto.version).toBe(session.version);
      expect(typeof dto.createdAt).toBe('number');
      expect(typeof dto.expiresAt).toBe('number');
      expect(dto.deviceInfo).toBeDefined();
    });

    it('should set isCurrentSession to false by default', () => {
      const session = buildActiveSession();
      const dto = session.toClientDTO();
      expect(dto.isCurrentSession).toBe(false);
    });

    it('should round-trip through load', () => {
      const original = buildActiveSession();
      const dto = original.toServerDTO();

      const restored = AuthSession.load({
        id: dto.id as AuthSessionId,
        identityId: dto.identityId as IdentityId,
        deviceInfo: DeviceInfo.fromDTO(dto.deviceInfo),
        refreshTokenHash: dto.refreshTokenHash,
        status: SessionStatus.of(dto.status),
        version: dto.version,
        createdAt: new Date(dto.createdAt),
        expiresAt: new Date(dto.expiresAt),
        lastActiveAt: new Date(dto.lastActiveAt),
        isRevoked: dto.isRevoked,
      });

      expect(restored.id).toBe(original.id);
      expect(restored.identityId).toBe(original.identityId);
      expect(restored.status).toBe(original.status);
      expect(restored.isRevoked).toBe(original.isRevoked);
    });
  });
});
