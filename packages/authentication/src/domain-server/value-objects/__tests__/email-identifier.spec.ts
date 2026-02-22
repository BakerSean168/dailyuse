/**
 * EmailIdentifier Value Object Tests
 */
import { describe, it, expect } from 'vitest';
import { EmailIdentifier } from '../email-identifier';

describe('EmailIdentifier', () => {
  describe('create', () => {
    it('should create an email identifier with valid email', () => {
      const identifier = EmailIdentifier.create('test@example.com');
      expect(identifier.type).toBe('EMAIL');
      expect(identifier.value).toBe('test@example.com');
      expect(identifier.isVerified).toBe(false);
    });

    it('should create a verified email identifier', () => {
      const identifier = EmailIdentifier.create('test@example.com', true);
      expect(identifier.isVerified).toBe(true);
    });

    it('should throw for invalid email', () => {
      expect(() => EmailIdentifier.create('invalid-email')).toThrow();
    });
  });

  describe('verify', () => {
    it('should return a new verified instance', () => {
      const identifier = EmailIdentifier.create('test@example.com');
      const verified = identifier.verify();
      expect(verified.isVerified).toBe(true);
      expect(identifier.isVerified).toBe(false); // original unchanged (immutable)
    });

    it('should return same instance if already verified', () => {
      const identifier = EmailIdentifier.create('test@example.com', true);
      const verified = identifier.verify();
      expect(verified).toBe(identifier); // same reference
    });
  });

  describe('equals', () => {
    it('should be equal when emails match', () => {
      const a = EmailIdentifier.create('test@example.com');
      const b = EmailIdentifier.create('test@example.com');
      expect(a.equals(b)).toBe(true);
    });

    it('should not be equal when emails differ', () => {
      const a = EmailIdentifier.create('a@example.com');
      const b = EmailIdentifier.create('b@example.com');
      expect(a.equals(b)).toBe(false);
    });
  });

  describe('serialization', () => {
    it('should serialize to DTO', () => {
      const identifier = EmailIdentifier.create('test@example.com', true);
      const dto = identifier.toDTO();
      expect(dto).toEqual({
        type: 'EMAIL',
        value: 'test@example.com',
        isVerified: true,
      });
    });

    it('should deserialize from DTO', () => {
      const dto = { type: 'EMAIL' as const, value: 'test@example.com', isVerified: true };
      const identifier = EmailIdentifier.fromDTO(dto);
      expect(identifier.value).toBe('test@example.com');
      expect(identifier.isVerified).toBe(true);
    });
  });
});
