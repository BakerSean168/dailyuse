/**
 * AuthIdentity Aggregate Root Tests
 * 
 * Tests for the refactored AuthIdentity with:
 * - identifiers (EmailIdentifier, PhoneIdentifier)
 * - oauthBindings (OAuthBinding)
 * - credentials (PasswordCredential only)
 */
import { describe, it, expect, vi } from 'vitest';
import { AuthIdentity } from '../auth-identity';
import type { IPasswordHasher } from '../../../domain-shared';

// Mock password hasher that returns a valid PHC-formatted argon2 hash
const MOCK_HASH = '$argon2id$v=19$m=65536,t=3,p=4$bW9ja3NhbHQ$bW9ja2hhc2h2YWx1ZQ';
const mockHasher: IPasswordHasher = {
  hash: vi.fn().mockResolvedValue(MOCK_HASH),
  compare: vi.fn().mockResolvedValue(true),
  algorithm: 'ARGON2' as any,
};

describe('AuthIdentity', () => {
  describe('createWithEmailAndPassword', () => {
    it('should create identity with email identifier and password credential', async () => {
      const identity = await AuthIdentity.createWithEmailAndPassword({
        email: 'test@example.com',
        plainPassword: 'StrongP@ss1',
        hasher: mockHasher,
      });

      expect(identity.id).toBeDefined();
      expect(identity.status).toBe('UNVERIFIED');
      
      // Email should be in identifiers
      expect(identity.identifiers).toHaveLength(1);
      expect(identity.identifiers[0].type).toBe('EMAIL');
      expect(identity.identifiers[0].value).toBe('test@example.com');
      expect(identity.identifiers[0].isVerified).toBe(false);

      // Password should be in credentials
      expect(identity.credentials).toHaveLength(1);
      expect(identity.credentials[0].type).toBe('PASSWORD');

      // OAuth bindings should be empty
      expect(identity.oauthBindings).toHaveLength(0);

      // Check convenience methods
      expect(identity.hasEmail()).toBe(true);
      expect(identity.hasPhone()).toBe(false);
      expect(identity.hasOAuth()).toBe(false);
      expect(identity.hasPassword()).toBe(true);
    });

    it('should emit identity-created domain event', async () => {
      const identity = await AuthIdentity.createWithEmailAndPassword({
        email: 'test@example.com',
        plainPassword: 'StrongP@ss1',
        hasher: mockHasher,
      });

      const events = identity.domainEvents;
      expect(events.length).toBeGreaterThan(0);
      expect(events[0].eventType).toBe('auth:identity-created');
      expect((events[0].payload as any).createMethod).toBe('EMAIL');
      expect((events[0].payload as any).email).toBe('test@example.com');
    });
  });

  describe('createWithOAuth', () => {
    it('should create identity with OAuth binding', () => {
      const identity = AuthIdentity.createWithOAuth({
        provider: 'GOOGLE' as any,
        sub: 'google-user-123',
      });

      expect(identity.id).toBeDefined();
      expect(identity.identifiers).toHaveLength(0);
      expect(identity.oauthBindings).toHaveLength(1);
      expect(identity.oauthBindings[0].provider).toBe('GOOGLE');
      expect(identity.oauthBindings[0].providerSubjectId).toBe('google-user-123');
      expect(identity.credentials).toHaveLength(0);
      expect(identity.hasOAuth()).toBe(true);
      expect(identity.hasPassword()).toBe(false);
    });
  });

  describe('identifier management', () => {
    let identity: AuthIdentity;

    it('should add email identifier', async () => {
      identity = await AuthIdentity.createWithEmailAndPassword({
        email: 'first@example.com',
        plainPassword: 'StrongP@ss1',
        hasher: mockHasher,
      });

      identity.addEmailIdentifier('second@example.com');
      expect(identity.identifiers).toHaveLength(2);
    });

    it('should throw when adding duplicate email', async () => {
      identity = await AuthIdentity.createWithEmailAndPassword({
        email: 'test@example.com',
        plainPassword: 'StrongP@ss1',
        hasher: mockHasher,
      });

      expect(() => identity.addEmailIdentifier('test@example.com')).toThrow('Email already bound');
    });

    it('should add phone identifier', async () => {
      identity = await AuthIdentity.createWithEmailAndPassword({
        email: 'test@example.com',
        plainPassword: 'StrongP@ss1',
        hasher: mockHasher,
      });

      identity.addPhoneIdentifier('13800138000');
      expect(identity.hasPhone()).toBe(true);
      expect(identity.identifiers).toHaveLength(2);
    });

    it('should verify email identifier', async () => {
      identity = await AuthIdentity.createWithEmailAndPassword({
        email: 'test@example.com',
        plainPassword: 'StrongP@ss1',
        hasher: mockHasher,
      });

      identity.verifyEmailIdentifier('test@example.com');
      const emailId = identity.findIdentifierByEmail('test@example.com');
      expect(emailId?.isVerified).toBe(true);
    });

    it('should verify phone identifier', async () => {
      identity = await AuthIdentity.createWithEmailAndPassword({
        email: 'test@example.com',
        plainPassword: 'StrongP@ss1',
        hasher: mockHasher,
      });

      identity.addPhoneIdentifier('13800138000');
      identity.verifyPhoneIdentifier('13800138000');
      const phoneId = identity.findIdentifierByPhone('13800138000');
      expect(phoneId?.isVerified).toBe(true);
    });

    it('should remove email identifier when other paths exist', async () => {
      identity = await AuthIdentity.createWithEmailAndPassword({
        email: 'test@example.com',
        plainPassword: 'StrongP@ss1',
        hasher: mockHasher,
      });

      identity.addEmailIdentifier('other@example.com');
      identity.removeEmailIdentifier('test@example.com');
      expect(identity.identifiers).toHaveLength(1);
      expect(identity.identifiers[0].value).toBe('other@example.com');
    });

    it('should find identifier by email', async () => {
      identity = await AuthIdentity.createWithEmailAndPassword({
        email: 'test@example.com',
        plainPassword: 'StrongP@ss1',
        hasher: mockHasher,
      });

      const found = identity.findIdentifierByEmail('test@example.com');
      expect(found).not.toBeNull();
      expect(found!.value).toBe('test@example.com');

      const notFound = identity.findIdentifierByEmail('missing@example.com');
      expect(notFound).toBeNull();
    });
  });

  describe('serialization', () => {
    it('should round-trip through ServerDTO', async () => {
      const original = await AuthIdentity.createWithEmailAndPassword({
        email: 'test@example.com',
        plainPassword: 'StrongP@ss1',
        hasher: mockHasher,
      });

      const dto = original.toServerDTO();
      const restored = AuthIdentity.fromServerDTO(dto);

      expect(restored.id).toBe(original.id);
      expect(restored.identifiers).toHaveLength(1);
      expect(restored.identifiers[0].value).toBe('test@example.com');
      expect(restored.credentials).toHaveLength(1);
    });

    it('should produce correct ClientDTO', async () => {
      const identity = await AuthIdentity.createWithEmailAndPassword({
        email: 'test@example.com',
        plainPassword: 'StrongP@ss1',
        hasher: mockHasher,
      });

      const clientDto = identity.toClientDTO();
      expect(clientDto.identifiers).toHaveLength(1);
      expect(clientDto.identifiers[0].type).toBe('EMAIL');
      expect(clientDto.hasPassword).toBe(true);
      expect(clientDto.hasEmail).toBe(true);
      expect(clientDto.hasPhone).toBe(false);
      expect(clientDto.hasOAuth).toBe(false);
    });

    it('should produce correct ServerDTO', async () => {
      const identity = await AuthIdentity.createWithEmailAndPassword({
        email: 'test@example.com',
        plainPassword: 'StrongP@ss1',
        hasher: mockHasher,
      });

      const dto = identity.toServerDTO();
      expect(dto.identifiers).toHaveLength(1);
      expect(dto.oauthBindings).toHaveLength(0);
      expect(dto.credentials).toHaveLength(1);
    });
  });

  describe('login failure tracking', () => {
    it('should track failed login attempts', async () => {
      const identity = await AuthIdentity.createWithEmailAndPassword({
        email: 'test@example.com',
        plainPassword: 'StrongP@ss1',
        hasher: mockHasher,
      });

      identity.recordFailedLogin();
      expect(identity.failedLoginAttempts).toBe(1);
      expect(identity.lastFailedAttempt).toBeInstanceOf(Date);
    });

    it('should lock after 5 failed attempts', async () => {
      const identity = await AuthIdentity.createWithEmailAndPassword({
        email: 'test@example.com',
        plainPassword: 'StrongP@ss1',
        hasher: mockHasher,
      });

      for (let i = 0; i < 5; i++) {
        identity.recordFailedLogin();
      }
      expect(identity.status).toBe('LOCKED');
      expect(identity.lockedUntil).toBeInstanceOf(Date);
    });

    it('should reset failed attempts', async () => {
      const identity = await AuthIdentity.createWithEmailAndPassword({
        email: 'test@example.com',
        plainPassword: 'StrongP@ss1',
        hasher: mockHasher,
      });

      identity.recordFailedLogin();
      identity.resetFailedAttempts();
      expect(identity.failedLoginAttempts).toBe(0);
    });
  });
});
