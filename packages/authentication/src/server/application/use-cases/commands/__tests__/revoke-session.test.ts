/**
 * RevokeSession Application Command Tests (residual 139)
 */
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { RevokeSessionUseCase } from '../revoke-session.use-case';
import { AuthSession } from '../../../../domain/aggregates/auth-session';
import type { IAuthSessionRepository } from '../../../../domain/repositories/i-auth-session.repository';
import type { ExecutionContext } from '@memoflow/contracts/shared';
import { AuthSessionId, DeviceInfo } from '../../../../domain';
import { IdentityId } from '@memoflow/domain-shared/shared';
import { REFRESH_TOKEN_DURATION_MS } from '../../../../domain/aggregates/auth-session';

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

function createContext(identityId: string): ExecutionContext {
  return { identityId };
}

describe('RevokeSession (Application Command)', () => {
  let sessionRepo: IAuthSessionRepository;
  let useCase: RevokeSessionUseCase;

  beforeEach(() => {
    sessionRepo = createMockSessionRepo();
    useCase = new RevokeSessionUseCase(sessionRepo);
  });

  it('revokes an owned valid session via findByIdForIdentity', async () => {
    const identityId = IdentityId.of('IdentityId_550e8400-e29b-41d4-a716-446655440001');
    const session = buildActiveSession(identityId);
    (sessionRepo.findByIdForIdentity as ReturnType<typeof vi.fn>).mockResolvedValue(session);

    const result = await useCase.execute(
      { sessionId: String(session.id) },
      createContext(String(identityId)),
    );

    expect(result.ok).toBe(true);
    expect(session.isRevoked).toBe(true);
    expect(sessionRepo.findByIdForIdentity).toHaveBeenCalledWith(identityId, session.id);
    expect(sessionRepo.save).toHaveBeenCalledWith(session);
    expect(sessionRepo.findById).not.toHaveBeenCalled();
  });

  it('returns NOT_FOUND when owned load misses (including foreign sessions)', async () => {
    (sessionRepo.findByIdForIdentity as ReturnType<typeof vi.fn>).mockResolvedValue(null);

    const result = await useCase.execute(
      { sessionId: 'AuthSessionId_missing' },
      createContext('IdentityId_550e8400-e29b-41d4-a716-446655440001'),
    );

    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.error.code).toBe('NOT_FOUND');
    }
    expect(sessionRepo.save).not.toHaveBeenCalled();
  });
});
