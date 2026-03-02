/**
 * LoginService Domain Service Tests
 *
 * Tests for the LoginService which coordinates:
 * - Identity lookup by email
 * - Password verification via the aggregate
 * - Persistence after successful login
 */
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { LoginService, UserNotFoundError, InvalidPasswordError } from '../login';
import { AuthIdentity } from '../../aggregates/auth-identity';
import type { IAuthIdentityRepository } from '../../repositories/i-auth-identity.repository';
import type { IPasswordHasher } from '../../../domain-shared';

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

/**
 * Helper to create a valid AuthIdentity for test scenarios.
 */
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

describe('LoginService', () => {
  let identityRepo: IAuthIdentityRepository;
  let passwordHasher: IPasswordHasher;
  let service: LoginService;

  beforeEach(() => {
    passwordHasher = createMockHasher(true);
    identityRepo = createMockIdentityRepo();
    service = new LoginService(identityRepo, passwordHasher);
  });

  describe('loginByEmail', () => {
    it('should return identity on successful login with valid credentials', async () => {
      const identity = await buildIdentity('user@example.com', passwordHasher);
      (identityRepo.findByEmail as ReturnType<typeof vi.fn>).mockResolvedValue(identity);

      const result = await service.loginByEmail({
        email: 'user@example.com',
        password: 'StrongP@ss1',
      });

      expect(result).toBe(identity);
      expect(identityRepo.findByEmail).toHaveBeenCalledWith('user@example.com');
      expect(identityRepo.save).toHaveBeenCalledWith(identity);
    });

    it('should throw UserNotFoundError when email does not exist', async () => {
      (identityRepo.findByEmail as ReturnType<typeof vi.fn>).mockResolvedValue(null);

      await expect(
        service.loginByEmail({ email: 'nobody@example.com', password: 'any' }),
      ).rejects.toThrow(UserNotFoundError);

      await expect(
        service.loginByEmail({ email: 'nobody@example.com', password: 'any' }),
      ).rejects.toThrow('nobody@example.com');
    });

    it('should throw InvalidPasswordError when password is wrong', async () => {
      // Create hasher that says password is wrong
      const wrongHasher = createMockHasher(false);
      const identity = await buildIdentity('user@example.com');

      // For the service we need the service's hasher to return false during verify
      const serviceHasher = createMockHasher(false);
      const svc = new LoginService(
        createMockIdentityRepo({
          findByEmail: vi.fn().mockResolvedValue(identity),
        }),
        serviceHasher,
      );

      await expect(
        svc.loginByEmail({ email: 'user@example.com', password: 'WrongPass1!' }),
      ).rejects.toThrow(InvalidPasswordError);
    });

    it('should persist the identity after successful login', async () => {
      const identity = await buildIdentity('user@example.com', passwordHasher);
      (identityRepo.findByEmail as ReturnType<typeof vi.fn>).mockResolvedValue(identity);

      await service.loginByEmail({ email: 'user@example.com', password: 'StrongP@ss1' });

      expect(identityRepo.save).toHaveBeenCalledTimes(1);
      expect(identityRepo.save).toHaveBeenCalledWith(identity);
    });

    it('should not persist when user is not found', async () => {
      (identityRepo.findByEmail as ReturnType<typeof vi.fn>).mockResolvedValue(null);

      await expect(
        service.loginByEmail({ email: 'ghost@example.com', password: 'any' }),
      ).rejects.toThrow();

      expect(identityRepo.save).not.toHaveBeenCalled();
    });

    it('should not persist when password verification fails', async () => {
      const identity = await buildIdentity('user@example.com');
      const serviceHasher = createMockHasher(false);
      const repo = createMockIdentityRepo({
        findByEmail: vi.fn().mockResolvedValue(identity),
      });
      const svc = new LoginService(repo, serviceHasher);

      await expect(
        svc.loginByEmail({ email: 'user@example.com', password: 'bad' }),
      ).rejects.toThrow();

      expect(repo.save).not.toHaveBeenCalled();
    });

    it('should call verifyPassword on the identity aggregate with the hasher', async () => {
      const identity = await buildIdentity('user@example.com', passwordHasher);
      const verifySpy = vi.spyOn(identity, 'verifyPassword');
      (identityRepo.findByEmail as ReturnType<typeof vi.fn>).mockResolvedValue(identity);

      await service.loginByEmail({ email: 'user@example.com', password: 'StrongP@ss1' });

      expect(verifySpy).toHaveBeenCalledWith('StrongP@ss1', passwordHasher);
    });
  });
});
