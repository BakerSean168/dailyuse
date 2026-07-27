/**
 * RegistrationService Domain Service Tests
 *
 * Tests for the RegistrationService which coordinates:
 * - Email uniqueness check
 * - AuthIdentity creation with hashed password
 * - Persistence of the new identity
 * - Domain event publication
 */
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { RegistrationService, UserAlreadyExistsError } from '../registration';
import type { IAuthIdentityRepository } from '../../repositories/i-auth-identity.repository';
import type { IPasswordHasher } from '../..';

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

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

describe('RegistrationService', () => {
  let identityRepo: IAuthIdentityRepository;
  let passwordHasher: IPasswordHasher;
  let service: RegistrationService;

  beforeEach(() => {
    passwordHasher = createMockHasher();
    identityRepo = createMockIdentityRepo();
    service = new RegistrationService(identityRepo, passwordHasher);
  });

  describe('registerByEmail', () => {
    it('should create and persist a new identity with email', async () => {
      const identity = await service.registerByEmail({
        email: 'new@example.com',
        password: 'StrongP@ss1',
      });

      expect(identity).toBeDefined();
      expect(identity.id).toBeDefined();

      // Email should be stored as an identifier
      expect(identity.identifiers).toHaveLength(1);
      expect(identity.identifiers[0].type).toBe('Email');
      expect(identity.identifiers[0].value).toBe('new@example.com');

      // Password credential should exist
      expect(identity.credentials).toHaveLength(1);
      expect(identity.credentials[0].type).toBe('Password');

      // Should have been persisted
      expect(identityRepo.save).toHaveBeenCalledTimes(1);
      expect(identityRepo.save).toHaveBeenCalledWith(identity);
    });

    it('should check email uniqueness before creating', async () => {
      await service.registerByEmail({
        email: 'unique@example.com',
        password: 'StrongP@ss1',
      });

      expect(identityRepo.existsByEmail).toHaveBeenCalledWith('unique@example.com');
    });

    it('should throw UserAlreadyExistsError for duplicate email', async () => {
      (identityRepo.existsByEmail as ReturnType<typeof vi.fn>).mockResolvedValue(true);

      await expect(
        service.registerByEmail({
          email: 'taken@example.com',
          password: 'StrongP@ss1',
        }),
      ).rejects.toThrow(UserAlreadyExistsError);

      await expect(
        service.registerByEmail({
          email: 'taken@example.com',
          password: 'StrongP@ss1',
        }),
      ).rejects.toThrow('taken@example.com');
    });

    it('should not persist when email is duplicate', async () => {
      (identityRepo.existsByEmail as ReturnType<typeof vi.fn>).mockResolvedValue(true);

      await expect(
        service.registerByEmail({
          email: 'taken@example.com',
          password: 'StrongP@ss1',
        }),
      ).rejects.toThrow();

      expect(identityRepo.save).not.toHaveBeenCalled();
    });

    it('should call password hashing during creation', async () => {
      await service.registerByEmail({
        email: 'new@example.com',
        password: 'StrongP@ss1',
      });

      expect(passwordHasher.hash).toHaveBeenCalled();
    });

    it('should emit identity-created domain event', async () => {
      const identity = await service.registerByEmail({
        email: 'new@example.com',
        password: 'StrongP@ss1',
      });

      const events = identity.domainEvents;
      expect(events.length).toBeGreaterThan(0);

      const createdEvent = events.find((e) => e.eventType === 'auth:identity-created');
      expect(createdEvent).toBeDefined();
      expect((createdEvent!.payload as any).createMethod).toBe('Email');
      expect((createdEvent!.payload as any).email).toBe('new@example.com');
    });

    it('should create identity with Unverified status', async () => {
      const identity = await service.registerByEmail({
        email: 'new@example.com',
        password: 'StrongP@ss1',
      });

      expect(identity.status).toBe('Unverified');
    });

    it('should create identity with zero failed login attempts', async () => {
      const identity = await service.registerByEmail({
        email: 'new@example.com',
        password: 'StrongP@ss1',
      });

      expect(identity.failedLoginAttempts).toBe(0);
      expect(identity.lockedUntil).toBeNull();
    });
  });
});
