import { describe, it, expect } from 'vitest';
import { ContactEmail } from '../contact-email';
import type { ContactEmailDTO } from '@memoflow/contracts/account';

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function anEmailDTO(overrides: Partial<ContactEmailDTO> = {}): ContactEmailDTO {
  return {
    address: 'user@example.com',
    isVerified: false,
    verifiedAt: null,
    isPrimary: true,
    ...overrides,
  };
}

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

describe('ContactEmail', () => {
  // =========================================================================
  // create
  // =========================================================================
  describe('create', () => {
    it('should create with valid email address', () => {
      const email = ContactEmail.create(anEmailDTO());
      expect(email.address).toBe('user@example.com');
      expect(email.isVerified).toBe(false);
      expect(email.isPrimary).toBe(true);
    });

    it('should reject invalid email format', () => {
      expect(() => ContactEmail.create(anEmailDTO({ address: 'not-an-email' }))).toThrow(
        'Invalid email address format',
      );
    });

    it('should reject email without @ symbol', () => {
      expect(() => ContactEmail.create(anEmailDTO({ address: 'noatsign.com' }))).toThrow(
        'Invalid email address format',
      );
    });

    it('should reject email longer than 255 characters', () => {
      const longEmail = 'a'.repeat(250) + '@b.com';
      expect(() => ContactEmail.create(anEmailDTO({ address: longEmail }))).toThrow(
        'Email address too long',
      );
    });

    it('should accept valid email formats', () => {
      const addresses = ['a@b.co', 'user+tag@domain.org', 'test.name@sub.domain.com'];
      for (const address of addresses) {
        const email = ContactEmail.create(anEmailDTO({ address }));
        expect(email.address).toBe(address);
      }
    });
  });

  // =========================================================================
  // createUnverified
  // =========================================================================
  describe('createUnverified', () => {
    it('should create unverified primary email', () => {
      const email = ContactEmail.createUnverified('new@example.com');
      expect(email.address).toBe('new@example.com');
      expect(email.isVerified).toBe(false);
      expect(email.isPrimary).toBe(true);
      expect(email.verifiedAt).toBeNull();
    });

    it('should reject invalid email', () => {
      expect(() => ContactEmail.createUnverified('invalid')).toThrow(
        'Invalid email address format',
      );
    });
  });

  // =========================================================================
  // verify
  // =========================================================================
  describe('verify', () => {
    it('should return a new verified email', () => {
      const original = ContactEmail.create(anEmailDTO());
      const verified = original.verify();
      expect(verified.isVerified).toBe(true);
      expect(verified.verifiedAt).toEqual(expect.any(Number));
      expect(original.isVerified).toBe(false);
    });

    it('should not overwrite verifiedAt if already verified', () => {
      const alreadyVerified = ContactEmail.create(
        anEmailDTO({ isVerified: true, verifiedAt: 1000 }),
      );
      const reverified = alreadyVerified.verify();
      expect(reverified.verifiedAt).toBe(1000);
    });
  });

  // =========================================================================
  // markAsPrimary / unmarkAsPrimary
  // =========================================================================
  describe('markAsPrimary', () => {
    it('should mark as primary', () => {
      const email = ContactEmail.create(anEmailDTO({ isPrimary: false }));
      const primary = email.markAsPrimary();
      expect(primary.isPrimary).toBe(true);
    });
  });

  describe('unmarkAsPrimary', () => {
    it('should unmark as primary', () => {
      const email = ContactEmail.create(anEmailDTO({ isPrimary: true }));
      const nonPrimary = email.unmarkAsPrimary();
      expect(nonPrimary.isPrimary).toBe(false);
    });
  });

  // =========================================================================
  // utility methods
  // =========================================================================
  describe('getMaskedAddress', () => {
    it('should mask middle characters of local part', () => {
      const email = ContactEmail.create(anEmailDTO({ address: 'john@example.com' }));
      expect(email.getMaskedAddress()).toBe('j***n@example.com');
    });
  });

  describe('getLocalPart', () => {
    it('should return the part before @', () => {
      const email = ContactEmail.create(anEmailDTO({ address: 'alice@domain.com' }));
      expect(email.getLocalPart()).toBe('alice');
    });
  });

  describe('getDomain', () => {
    it('should return the part after @', () => {
      const email = ContactEmail.create(anEmailDTO({ address: 'alice@domain.com' }));
      expect(email.getDomain()).toBe('domain.com');
    });
  });

  // =========================================================================
  // serialization
  // =========================================================================
  describe('toDTO', () => {
    it('should return all props as plain object', () => {
      const props = anEmailDTO();
      const email = ContactEmail.create(props);
      expect(email.toDTO()).toEqual(props);
    });
  });

  // =========================================================================
  // value object equality
  // =========================================================================
  describe('equals', () => {
    it('should consider two emails with same props as equal', () => {
      const a = ContactEmail.create(anEmailDTO());
      const b = ContactEmail.create(anEmailDTO());
      expect(a.equals(b)).toBe(true);
    });

    it('should consider emails with different addresses as not equal', () => {
      const a = ContactEmail.create(anEmailDTO({ address: 'a@test.com' }));
      const b = ContactEmail.create(anEmailDTO({ address: 'b@test.com' }));
      expect(a.equals(b)).toBe(false);
    });
  });
});
