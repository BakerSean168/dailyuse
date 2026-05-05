import { describe, it, expect } from 'vitest';
import { ContactPhone } from '../contact-phone';
import type { ContactPhoneDTO } from '@dailyuse/contracts/account';

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function aPhoneDTO(overrides: Partial<ContactPhoneDTO> = {}): ContactPhoneDTO {
  return {
    countryCode: '+86',
    number: '13800138000',
    fullNumber: '+8613800138000',
    isVerified: false,
    verifiedAt: null,
    ...overrides,
  };
}

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

describe('ContactPhone', () => {
  // =========================================================================
  // create
  // =========================================================================
  describe('create', () => {
    it('should create with valid 11-digit phone number', () => {
      const phone = ContactPhone.create(aPhoneDTO());
      expect(phone.number).toBe('13800138000');
      expect(phone.countryCode).toBe('+86');
      expect(phone.fullNumber).toBe('+8613800138000');
      expect(phone.isVerified).toBe(false);
    });

    it('should reject non-11-digit number', () => {
      expect(() => ContactPhone.create(aPhoneDTO({ number: '1234567' }))).toThrow(
        'Invalid phone number format',
      );
    });

    it('should reject phone with letters', () => {
      expect(() => ContactPhone.create(aPhoneDTO({ number: '1380013abcd' }))).toThrow(
        'Invalid phone number format',
      );
    });

    it('should reject empty country code', () => {
      expect(() => ContactPhone.create(aPhoneDTO({ countryCode: '' }))).toThrow(
        'Country code cannot be empty',
      );
    });

    it('should reject empty full number', () => {
      expect(() => ContactPhone.create(aPhoneDTO({ fullNumber: '' }))).toThrow(
        'Full phone number cannot be empty',
      );
    });
  });

  // =========================================================================
  // createUnverified
  // =========================================================================
  describe('createUnverified', () => {
    it('should create unverified phone', () => {
      const phone = ContactPhone.createUnverified('+86', '13900139000', '+8613900139000');
      expect(phone.isVerified).toBe(false);
      expect(phone.verifiedAt).toBeNull();
      expect(phone.number).toBe('13900139000');
    });

    it('should reject invalid number format', () => {
      expect(() => ContactPhone.createUnverified('+86', '123', '+86123')).toThrow(
        'Invalid phone number format',
      );
    });
  });

  // =========================================================================
  // verify
  // =========================================================================
  describe('verify', () => {
    it('should return a new verified phone', () => {
      const original = ContactPhone.create(aPhoneDTO());
      const verified = original.verify();
      expect(verified.isVerified).toBe(true);
      expect(verified.verifiedAt).toBeInstanceOf(Date);
      expect(original.isVerified).toBe(false);
    });

    it('should not overwrite verifiedAt if already verified', () => {
      const alreadyVerified = ContactPhone.create(
        aPhoneDTO({ isVerified: true, verifiedAt: 1000 }),
      );
      const reverified = alreadyVerified.verify();
      expect(reverified.verifiedAt).toEqual(new Date(1000));
    });
  });

  // =========================================================================
  // formatting
  // =========================================================================
  describe('getFormattedNumber', () => {
    it('should format number with spaces', () => {
      const phone = ContactPhone.create(aPhoneDTO({ number: '13800138000' }));
      expect(phone.getFormattedNumber()).toBe('+86 138 0013 8000');
    });
  });

  describe('getMaskedNumber', () => {
    it('should mask middle digits', () => {
      const phone = ContactPhone.create(aPhoneDTO({ number: '13800138000' }));
      expect(phone.getMaskedNumber()).toBe('+86 138****8000');
    });
  });

  // =========================================================================
  // serialization
  // =========================================================================
  describe('toDTO', () => {
    it('should return plain object with all props', () => {
      const props = aPhoneDTO();
      const phone = ContactPhone.create(props);
      expect(phone.toDTO()).toEqual(props);
    });
  });

  // =========================================================================
  // value object equality
  // =========================================================================
  describe('equals', () => {
    it('should consider two phones with same props as equal', () => {
      const a = ContactPhone.create(aPhoneDTO());
      const b = ContactPhone.create(aPhoneDTO());
      expect(a.equals(b)).toBe(true);
    });

    it('should consider phones with different numbers as not equal', () => {
      const a = ContactPhone.create(aPhoneDTO({ number: '13800138000' }));
      const b = ContactPhone.create(aPhoneDTO({ number: '13900139000' }));
      expect(a.equals(b)).toBe(false);
    });
  });
});
