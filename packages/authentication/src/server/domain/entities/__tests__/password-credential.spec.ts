import { describe, it, expect, beforeEach, vi } from 'vitest';
import { CredentialStatus, HashedPassword, AuthCredentialId } from '../..';
import type { IPasswordHasher } from '../..';
import { PasswordCredential } from '../password-credential';

const MOCK_HASH = '$argon2id$v=19$m=65536,t=3,p=4$bW9ja3NhbHQ$bW9ja2hhc2h2YWx1ZQ';
const mockHasher: IPasswordHasher = {
  hash: vi.fn().mockResolvedValue(MOCK_HASH),
  compare: vi.fn().mockResolvedValue(true),
};

describe('PasswordCredential Entity', () => {
  let credentialId: AuthCredentialId;
  let hashedPassword: HashedPassword;

  beforeEach(async () => {
    credentialId = 'AuthCredentialId_test-123' as AuthCredentialId;
    hashedPassword = await HashedPassword.create(
      { value: 'TestPassword123!' },
      mockHasher,
    );
  });

  describe('Factory Methods', () => {
    it('should create a new password credential with initial state', () => {
      const credential = PasswordCredential.create({
        id: credentialId,
        hashedPassword,
      });

      expect(credential.id).toBe(credentialId);
      expect(credential.status).toBe(CredentialStatus.Active);
      expect(credential.hashedPassword).toEqual(hashedPassword);
      expect(credential.lastUsedAt).toBeNull();
      expect(credential.type).toBe('Password');
    });

    it('should load credential from persisted state', () => {
      const createdAt = new Date('2024-01-01T00:00:00Z');
      const passwordLastChangedAt = new Date('2024-01-15T00:00:00Z');

      const credential = PasswordCredential.load({
        id: credentialId,
        status: CredentialStatus.Active,
        hashedPassword,
        createdAt,
        passwordLastChangedAt,
        lastUsedAt: null,
      });

      expect(credential.id).toBe(credentialId);
      expect(credential.status).toBe(CredentialStatus.Active);
      expect(credential.createdAt).toEqual(createdAt);
      expect(credential.passwordLastChangedAt).toEqual(passwordLastChangedAt);
    });
  });

  describe('Password Comparison', () => {
    it('should delegate comparison to hasher', async () => {
      const credential = PasswordCredential.create({
        id: credentialId,
        hashedPassword,
      });

      const result = await credential.compare('TestPassword123!', mockHasher);
      expect(result).toBe(true);
    });
  });

  describe('Password Update', () => {
    it('should update password on active credential', async () => {
      const credential = PasswordCredential.create({
        id: credentialId,
        hashedPassword,
      });

      const newHashedPassword = await HashedPassword.create(
        { value: 'NewPassword123!' },
        mockHasher,
      );

      credential.updatePassword(newHashedPassword);

      expect(credential.hashedPassword).toEqual(newHashedPassword);
    });

    it('should reject password update on suspended credential', async () => {
      const credential = PasswordCredential.create({
        id: credentialId,
        hashedPassword,
      });
      credential.suspend();

      const newHashedPassword = await HashedPassword.create(
        { value: 'NewPassword123!' },
        mockHasher,
      );

      expect(() => credential.updatePassword(newHashedPassword)).toThrow(
        'Cannot update password on inactive credential',
      );
    });
  });;

  describe('Usage Tracking', () => {
    it('should record usage timestamp', () => {
      const credential = PasswordCredential.create({
        id: credentialId,
        hashedPassword,
      });

      expect(credential.lastUsedAt).toBeNull();

      credential.recordUsage();

      expect(credential.lastUsedAt).not.toBeNull();
    });
  });

  describe('Status Management', () => {
    it('should suspend active credential', () => {
      const credential = PasswordCredential.create({
        id: credentialId,
        hashedPassword,
      });

      expect(credential.status).toBe(CredentialStatus.Active);
      credential.suspend();
      expect(credential.status).toBe(CredentialStatus.Suspended);
    });

    it('should activate suspended credential', () => {
      const credential = PasswordCredential.load({
        id: credentialId,
        status: CredentialStatus.Suspended,
        hashedPassword,
        createdAt: new Date(),
        passwordLastChangedAt: new Date(),
        lastUsedAt: null,
      });

      credential.activate();
      expect(credential.status).toBe(CredentialStatus.Active);
    });

    it('should revoke credential', () => {
      const credential = PasswordCredential.create({
        id: credentialId,
        hashedPassword,
      });

      credential.revoke();
      expect(credential.status).toBe(CredentialStatus.Revoked);
    });

    it('should support full status lifecycle', () => {
      const credential = PasswordCredential.create({
        id: credentialId,
        hashedPassword,
      });

      credential.suspend();
      expect(credential.status).toBe(CredentialStatus.Suspended);

      credential.activate();
      expect(credential.status).toBe(CredentialStatus.Active);

      credential.revoke();
      expect(credential.status).toBe(CredentialStatus.Revoked);
    });
  });

  describe('Password Age Tracking', () => {
    it('should calculate password age in days', () => {
      const now = new Date();
      const passwordLastChangedAt = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);

      const credential = PasswordCredential.load({
        id: credentialId,
        status: CredentialStatus.Active,
        hashedPassword,
        createdAt: new Date(),
        passwordLastChangedAt,
        lastUsedAt: null,
      });

      const ageDays = credential.getPasswordAgeDays();
      expect(ageDays).toBeGreaterThanOrEqual(29);
      expect(ageDays).toBeLessThanOrEqual(31);
    });

    it('should indicate fresh password does not need reset', () => {
      const now = new Date();
      const passwordLastChangedAt = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);

      const credential = PasswordCredential.load({
        id: credentialId,
        status: CredentialStatus.Active,
        hashedPassword,
        createdAt: new Date(),
        passwordLastChangedAt,
        lastUsedAt: null,
      });

      expect(credential.needsPasswordChange()).toBe(false);
    });
  });

  describe('Serialization', () => {
    it('should serialize to DTO for server-side storage', () => {
      const createdAt = new Date('2024-01-01T00:00:00Z');
      const passwordLastChangedAt = new Date('2024-01-15T00:00:00Z');
      const lastUsedAt = new Date('2024-02-01T12:00:00Z');

      const credential = PasswordCredential.load({
        id: credentialId,
        status: CredentialStatus.Active,
        hashedPassword,
        createdAt,
        passwordLastChangedAt,
        lastUsedAt,
      });

      const dto = credential.toServerDTO();

      expect(dto.id).toBe(credentialId);
      expect(dto.status).toBe(CredentialStatus.Active);
      expect(dto.createdAt).toBe(createdAt.getTime());
      expect(dto.passwordLastChangedAt).toBe(passwordLastChangedAt.getTime());
      expect(dto.lastUsedAt).toBe(lastUsedAt.getTime());
    });
  });
});
