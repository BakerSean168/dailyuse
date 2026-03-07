/**
 * PhoneIdentifier Value Object Tests
 */
import { describe, it, expect } from 'vitest';
import { PhoneIdentifier } from '../phone-identifier';

describe('PhoneIdentifier', () => {
  describe('create', () => {
    it('should create a phone identifier with valid number', () => {
      const identifier = PhoneIdentifier.create('13800138000');
      expect(identifier.type).toBe('Phone');
      expect(identifier.value).toBe('13800138000');
      expect(identifier.isVerified).toBe(false);
    });

    it('should create a verified phone identifier', () => {
      const identifier = PhoneIdentifier.create('13800138000', true);
      expect(identifier.isVerified).toBe(true);
    });

    it('should throw for invalid phone number', () => {
      expect(() => PhoneIdentifier.create('123')).toThrow();
    });
  });

  describe('verify', () => {
    it('should return a new verified instance', () => {
      const identifier = PhoneIdentifier.create('13800138000');
      const verified = identifier.verify();
      expect(verified.isVerified).toBe(true);
      expect(identifier.isVerified).toBe(false); // original unchanged
    });

    it('should return same instance if already verified', () => {
      const identifier = PhoneIdentifier.create('13800138000', true);
      const verified = identifier.verify();
      expect(verified).toBe(identifier);
    });
  });

  describe('equals', () => {
    it('should be equal when phone numbers match', () => {
      const a = PhoneIdentifier.create('13800138000');
      const b = PhoneIdentifier.create('13800138000');
      expect(a.equals(b)).toBe(true);
    });

    it('should not be equal when numbers differ', () => {
      const a = PhoneIdentifier.create('13800138000');
      const b = PhoneIdentifier.create('13900139000');
      expect(a.equals(b)).toBe(false);
    });
  });

  describe('serialization', () => {
    it('should serialize to DTO', () => {
      const identifier = PhoneIdentifier.create('13800138000', true);
      const dto = identifier.toDTO();
      expect(dto).toEqual({
        type: 'Phone',
        value: { value: '13800138000' },
        isVerified: true,
      });
    });

    it('should deserialize from DTO', () => {
      const dto = { type: 'Phone' as const, value: { value: '13800138000' }, isVerified: true };
      const identifier = PhoneIdentifier.fromDTO(dto);
      expect(identifier.value).toBe('13800138000');
      expect(identifier.isVerified).toBe(true);
    });
  });

  describe('getMaskedPhoneNumber', () => {
    it('should return masked phone number', () => {
      const identifier = PhoneIdentifier.create('13800138000');
      const masked = identifier.getMaskedPhoneNumber();
      expect(masked).toMatch(/^138\*+8000$/);
    });
  });
});
