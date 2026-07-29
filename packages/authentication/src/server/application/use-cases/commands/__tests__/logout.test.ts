/**
 * Logout Application Command Tests
 *
 * Tests for the Logout use case which orchestrates:
 * - Finding all sessions for the identity
 * - Revoking valid sessions
 * - Persisting revoked sessions
 */
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { LogoutUseCase } from '../logout.use-case';
import { AuthSession } from '../../../../domain/aggregates/auth-session';
import type { IAuthSessionRepository } from '../../../../domain/repositories/i-auth-session.repository';
import type { ExecutionContext } from '@memoflow/contracts/shared';
import { AuthSessionId, SessionStatus, DeviceInfo } from '../../../../domain';
import { IdentityId } from '@memoflow/domain-shared/shared';
import { REFRESH_TOKEN_DURATION_MS } from '../../../../domain/aggregates/auth-session';

// ---------------------------------------------------------------------------
// Shared mock helpers
// ---------------------------------------------------------------------------

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

function buildActiveSession(identityId: IdentityId): AuthSession {
  return AuthSession.create({
    id: AuthSessionId.generate(),
    identityId,
    deviceInfo: DeviceInfo.createDefault('test-device'),
    refreshTokenHash: 'hash-abc',
    expiresAt: Date.now() + REFRESH_TOKEN_DURATION_MS,
  });
}

function buildExpiredSession(identityId: IdentityId): AuthSession {
  return AuthSession.load({
    id: AuthSessionId.generate(),
    identityId,
    deviceInfo: DeviceInfo.createDefault('test-device'),
    refreshTokenHash: 'hash-abc',
    status: SessionStatus.Expired,
    createdAt: new Date(Date.now() - 2 * REFRESH_TOKEN_DURATION_MS),
    expiresAt: new Date(Date.now() - REFRESH_TOKEN_DURATION_MS),
    lastActiveAt: new Date(Date.now() - 2 * REFRESH_TOKEN_DURATION_MS),
    isRevoked: false,
  });
}

function createContext(identityId = 'IdentityId_550e8400-e29b-41d4-a716-446655440001'): ExecutionContext {
  return { identityId };
}

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

describe('Logout (Application Command)', () => {
  let sessionRepo: IAuthSessionRepository;
  let useCase: LogoutUseCase;

  beforeEach(() => {
    sessionRepo = createMockSessionRepo();
    useCase = new LogoutUseCase(sessionRepo);
  });

  describe('execute', () => {
    it('should revoke all valid sessions for the identity', async () => {
      const identityId = IdentityId.of('IdentityId_550e8400-e29b-41d4-a716-446655440001');
      const session1 = buildActiveSession(identityId);
      const session2 = buildActiveSession(identityId);

      (sessionRepo.findByIdentityId as ReturnType<typeof vi.fn>).mockResolvedValue([
        session1,
        session2,
      ]);

      const result = await useCase.execute(undefined, createContext(identityId));

      expect(result.ok).toBe(true);
      expect(session1.isRevoked).toBe(true);
      expect(session2.isRevoked).toBe(true);
      expect(sessionRepo.save).toHaveBeenCalledTimes(2);
    });

    it('should save each revoked session', async () => {
      const identityId = IdentityId.of('IdentityId_550e8400-e29b-41d4-a716-446655440001');
      const session = buildActiveSession(identityId);

      (sessionRepo.findByIdentityId as ReturnType<typeof vi.fn>).mockResolvedValue([session]);

      const result = await useCase.execute(undefined, createContext(identityId));

      expect(result.ok).toBe(true);
      expect(sessionRepo.save).toHaveBeenCalledWith(session);
    });

    it('should skip already invalid sessions', async () => {
      const identityId = IdentityId.of('IdentityId_550e8400-e29b-41d4-a716-446655440001');
      const activeSession = buildActiveSession(identityId);
      const expiredSession = buildExpiredSession(identityId);

      (sessionRepo.findByIdentityId as ReturnType<typeof vi.fn>).mockResolvedValue([
        activeSession,
        expiredSession,
      ]);

      const result = await useCase.execute(undefined, createContext(identityId));

      expect(result.ok).toBe(true);
      // Only the active session should be saved
      expect(sessionRepo.save).toHaveBeenCalledTimes(1);
      expect(sessionRepo.save).toHaveBeenCalledWith(activeSession);
      expect(activeSession.isRevoked).toBe(true);
    });

    it('should handle no sessions gracefully', async () => {
      (sessionRepo.findByIdentityId as ReturnType<typeof vi.fn>).mockResolvedValue([]);

      const result = await useCase.execute(
        undefined,
        createContext('IdentityId_550e8400-e29b-41d4-a716-446655440001'),
      );

      expect(result.ok).toBe(true);
      expect(sessionRepo.save).not.toHaveBeenCalled();
    });

    it('should use identity id from context', async () => {
      const identityId = 'IdentityId_550e8400-e29b-41d4-a716-446655440002';
      (sessionRepo.findByIdentityId as ReturnType<typeof vi.fn>).mockResolvedValue([]);

      await useCase.execute(undefined, createContext(identityId));

      expect(sessionRepo.findByIdentityId).toHaveBeenCalledWith(IdentityId.of(identityId));
    });

    it('should skip sessions that are already revoked', async () => {
      const identityId = IdentityId.of('IdentityId_550e8400-e29b-41d4-a716-446655440001');
      const session = buildActiveSession(identityId);
      session.revoke(); // pre-revoke

      (sessionRepo.findByIdentityId as ReturnType<typeof vi.fn>).mockResolvedValue([session]);

      const result = await useCase.execute(undefined, createContext(identityId));

      expect(result.ok).toBe(true);
      // isValid() returns false for revoked sessions, so save should not be called
      expect(sessionRepo.save).not.toHaveBeenCalled();
    });
  });
});
