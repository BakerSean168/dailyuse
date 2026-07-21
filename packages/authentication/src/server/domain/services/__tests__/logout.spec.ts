/**
 * LogoutService Domain Service Tests
 *
 * Tests for the LogoutService which coordinates:
 * - Identity lookup by ID
 * - Login status check
 * - Clearing login state
 * - Persistence after logout
 */
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { LogoutService, UserNotFoundForLogoutError, NotLoggedInError } from '../logout';
import { AuthIdentity } from '../../aggregates/auth-identity';
import type { IAuthIdentityRepository } from '../../repositories/i-auth-identity.repository';
import type { IPasswordHasher } from '@/server/domain';
import { AuthIdentityStatus } from '@/server/domain';
import { IdentityId } from '@dailyuse/domain-shared/shared';
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
  findByOAuth: vi.fn().mockResolvedValue(null),
  existsByEmail: vi.fn().mockResolvedValue(false),
  delete: vi.fn().mockResolvedValue(undefined),
  ...overrides,
});

async function buildIdentity(email = 'test@example.com'): Promise<AuthIdentity> {
  return AuthIdentity.createWithEmailAndPassword({
    email,
    plainPassword: 'StrongP@ss1',
    hasher: createMockHasher(),
  });
}

function createContext(identityId: string): Context {
  return {
    identityId,
    deviceId: 'test-device-001',
  };
}

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

describe('LogoutService', () => {
  let identityRepo: IAuthIdentityRepository;
  let service: LogoutService;

  beforeEach(() => {
    identityRepo = createMockIdentityRepo();
    service = new LogoutService(identityRepo);
  });

  describe('logout', () => {
    it('should successfully logout an active identity', async () => {
      const identity = await buildIdentity();
      // Activate the identity so isLoggedIn() returns true
      identity.activate();

      (identityRepo.findById as ReturnType<typeof vi.fn>).mockResolvedValue(identity);

      const ctx = createContext(identity.id);
      const result = await service.logout(undefined as any, ctx);

      expect(result).toBe(identity);
      expect(identityRepo.save).toHaveBeenCalledWith(identity);
    });

    it('should throw UserNotFoundForLogoutError when identity not found', async () => {
      (identityRepo.findById as ReturnType<typeof vi.fn>).mockResolvedValue(null);

      const fakeId = IdentityId.generate();
      const ctx = createContext(fakeId);

      await expect(service.logout(undefined as any, ctx)).rejects.toThrow(
        UserNotFoundForLogoutError,
      );
    });

    it('should throw NotLoggedInError when identity is not active', async () => {
      const identity = await buildIdentity();
      // Identity is Unverified by default, isLoggedIn() checks isActive(status)
      // Unverified is not Active, so isLoggedIn() returns false
      (identityRepo.findById as ReturnType<typeof vi.fn>).mockResolvedValue(identity);

      const ctx = createContext(identity.id);

      await expect(service.logout(undefined as any, ctx)).rejects.toThrow(NotLoggedInError);
    });

    it('should throw NotLoggedInError when identity is locked', async () => {
      const identity = await buildIdentity();
      identity.activate();

      // Lock the identity by recording 5 failed logins
      for (let i = 0; i < 5; i++) {
        identity.recordFailedLogin();
      }

      (identityRepo.findById as ReturnType<typeof vi.fn>).mockResolvedValue(identity);

      const ctx = createContext(identity.id);

      await expect(service.logout(undefined as any, ctx)).rejects.toThrow(NotLoggedInError);
    });

    it('should call clearLogin on the identity', async () => {
      const identity = await buildIdentity();
      identity.activate();
      const clearSpy = vi.spyOn(identity, 'clearLogin');

      (identityRepo.findById as ReturnType<typeof vi.fn>).mockResolvedValue(identity);

      const ctx = createContext(identity.id);
      await service.logout(undefined as any, ctx);

      expect(clearSpy).toHaveBeenCalled();
    });

    it('should persist the identity after logout', async () => {
      const identity = await buildIdentity();
      identity.activate();

      (identityRepo.findById as ReturnType<typeof vi.fn>).mockResolvedValue(identity);

      const ctx = createContext(identity.id);
      await service.logout(undefined as any, ctx);

      expect(identityRepo.save).toHaveBeenCalledTimes(1);
      expect(identityRepo.save).toHaveBeenCalledWith(identity);
    });

    it('should not persist when identity is not found', async () => {
      (identityRepo.findById as ReturnType<typeof vi.fn>).mockResolvedValue(null);

      const ctx = createContext(IdentityId.generate());

      await expect(service.logout(undefined as any, ctx)).rejects.toThrow();
      expect(identityRepo.save).not.toHaveBeenCalled();
    });

    it('should not persist when identity is not logged in', async () => {
      const identity = await buildIdentity();
      // identity status is Unverified => isLoggedIn() returns false
      (identityRepo.findById as ReturnType<typeof vi.fn>).mockResolvedValue(identity);

      const ctx = createContext(identity.id);

      await expect(service.logout(undefined as any, ctx)).rejects.toThrow();
      expect(identityRepo.save).not.toHaveBeenCalled();
    });
  });
});
