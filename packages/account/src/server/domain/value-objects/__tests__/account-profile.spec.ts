import { describe, it, expect } from 'vitest';
import { AccountProfile } from '../account-profile';
import { GenderType } from '../gender-type';
import type { AccountProfileDTO } from '@memoflow/contracts/account';

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function aProfileDTO(overrides: Partial<AccountProfileDTO> = {}): AccountProfileDTO {
  return {
    nickname: 'TestUser',
    gender: GenderType.PreferNotToSay,
    realName: null,
    avatarUrl: null,
    bio: null,
    birthday: null,
    ...overrides,
  };
}

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

describe('AccountProfile', () => {
  // =========================================================================
  // create
  // =========================================================================
  describe('create', () => {
    it('should create a profile with valid props', () => {
      const profile = AccountProfile.create(aProfileDTO());
      expect(profile.nickname).toBe('TestUser');
      expect(profile.gender).toBe(GenderType.PreferNotToSay);
    });

    it('should reject nickname shorter than 2 characters', () => {
      expect(() => AccountProfile.create(aProfileDTO({ nickname: 'A' }))).toThrow(
        'Nickname must be at least 2 characters',
      );
    });

    it('should reject nickname longer than 20 characters', () => {
      expect(() => AccountProfile.create(aProfileDTO({ nickname: 'A'.repeat(21) }))).toThrow(
        'Nickname must be under 20 characters',
      );
    });

    it('should accept nickname exactly 2 characters', () => {
      const profile = AccountProfile.create(aProfileDTO({ nickname: 'AB' }));
      expect(profile.nickname).toBe('AB');
    });

    it('should accept nickname exactly 20 characters', () => {
      const profile = AccountProfile.create(aProfileDTO({ nickname: 'A'.repeat(20) }));
      expect(profile.nickname).toBe('A'.repeat(20));
    });

    it('should reject invalid gender type', () => {
      expect(() => AccountProfile.create(aProfileDTO({ gender: 'INVALID' as any }))).toThrow(
        'Invalid gender type',
      );
    });
  });

  // =========================================================================
  // createDefault
  // =========================================================================
  describe('createDefault', () => {
    it('should derive nickname from email local part', () => {
      const profile = AccountProfile.createDefault('john.doe@example.com');
      expect(profile.nickname).toBe('john.doe');
    });

    it('should truncate long email local part to 10 characters', () => {
      const profile = AccountProfile.createDefault('areallylongemail@example.com');
      expect(profile.nickname).toBe('areallylon');
    });

    it('should set default gender as PreferNotToSay', () => {
      const profile = AccountProfile.createDefault('test@example.com');
      expect(profile.gender).toBe(GenderType.PreferNotToSay);
    });

    it('should set all optional fields to null', () => {
      const profile = AccountProfile.createDefault('test@example.com');
      expect(profile.realName).toBeNull();
      expect(profile.avatarUrl).toBeNull();
      expect(profile.bio).toBeNull();
      expect(profile.birthday).toBeNull();
    });
  });

  // =========================================================================
  // update methods (immutable - each returns a new instance)
  // =========================================================================
  describe('updateNickname', () => {
    it('should return a new profile with updated nickname', () => {
      const original = AccountProfile.create(aProfileDTO({ nickname: 'OldName' }));
      const updated = original.updateNickname('NewName');
      expect(updated.nickname).toBe('NewName');
      expect(original.nickname).toBe('OldName');
    });

    it('should validate the new nickname', () => {
      const profile = AccountProfile.create(aProfileDTO());
      expect(() => profile.updateNickname('A')).toThrow('Nickname must be at least 2 characters');
    });
  });

  describe('updateAvatar', () => {
    it('should return a new profile with updated avatar URL', () => {
      const profile = AccountProfile.create(aProfileDTO());
      const updated = profile.updateAvatar('https://example.com/avatar.png');
      expect(updated.avatarUrl).toBe('https://example.com/avatar.png');
      expect(profile.avatarUrl).toBeNull();
    });
  });

  describe('updateBio', () => {
    it('should return a new profile with updated bio', () => {
      const profile = AccountProfile.create(aProfileDTO());
      const updated = profile.updateBio('Hello world');
      expect(updated.bio).toBe('Hello world');
    });

    it('should reject bio longer than 500 characters', () => {
      const profile = AccountProfile.create(aProfileDTO());
      expect(() => profile.updateBio('X'.repeat(501))).toThrow('Bio too long');
    });

    it('should accept bio exactly 500 characters', () => {
      const profile = AccountProfile.create(aProfileDTO());
      const updated = profile.updateBio('X'.repeat(500));
      expect(updated.bio).toBe('X'.repeat(500));
    });
  });

  describe('setRealName', () => {
    it('should return a new profile with real name set', () => {
      const profile = AccountProfile.create(aProfileDTO());
      const updated = profile.setRealName('John Doe');
      expect(updated.realName).toBe('John Doe');
    });
  });

  describe('updateGender', () => {
    it('should return a new profile with updated gender', () => {
      const profile = AccountProfile.create(aProfileDTO());
      const updated = profile.updateGender(GenderType.Male);
      expect(updated.gender).toBe(GenderType.Male);
    });
  });

  describe('setBirthday', () => {
    it('should return a new profile with birthday set as Ymd', () => {
      const profile = AccountProfile.create(aProfileDTO());
      const pastDate = new Date(2000, 0, 1).getTime();
      const updated = profile.setBirthday(pastDate);
      expect(updated.birthday).toBe('2000-01-01');
    });

    it('should reject future birthday', () => {
      const profile = AccountProfile.create(aProfileDTO());
      const futureDate = Date.now() + 86400000;
      expect(() => profile.setBirthday(futureDate)).toThrow('Birthday cannot be in the future');
    });
  });

  // =========================================================================
  // computed properties
  // =========================================================================
  describe('displayName', () => {
    it('should return realName when set', () => {
      const profile = AccountProfile.create(aProfileDTO({ realName: 'John Doe' }));
      expect(profile.displayName).toBe('John Doe');
    });

    it('should return nickname when realName is null', () => {
      const profile = AccountProfile.create(aProfileDTO({ realName: null }));
      expect(profile.displayName).toBe('TestUser');
    });
  });

  describe('getAge', () => {
    it('should return null when birthday is not set', () => {
      const profile = AccountProfile.create(aProfileDTO());
      expect(profile.getAge()).toBeNull();
    });

    it('should calculate age correctly', () => {
      const twentyYearsAgo = new Date();
      twentyYearsAgo.setFullYear(twentyYearsAgo.getFullYear() - 20);
      twentyYearsAgo.setMonth(0, 1); // Jan 1
      const profile = AccountProfile.create(aProfileDTO({ birthday: twentyYearsAgo.getTime() }));
      expect(profile.getAge()).toBeGreaterThanOrEqual(19);
      expect(profile.getAge()).toBeLessThanOrEqual(20);
    });
  });

  // =========================================================================
  // serialization
  // =========================================================================
  describe('toDTO', () => {
    it('should return a plain object with all props', () => {
      const props = aProfileDTO({ nickname: 'Serialized' });
      const profile = AccountProfile.create(props);
      const dto = profile.toDTO();
      expect(dto).toEqual(props);
    });
  });

  // =========================================================================
  // value object equality
  // =========================================================================
  describe('equals', () => {
    it('should consider two profiles with same props as equal', () => {
      const a = AccountProfile.create(aProfileDTO());
      const b = AccountProfile.create(aProfileDTO());
      expect(a.equals(b)).toBe(true);
    });

    it('should consider profiles with different nicknames as not equal', () => {
      const a = AccountProfile.create(aProfileDTO({ nickname: 'Alice' }));
      const b = AccountProfile.create(aProfileDTO({ nickname: 'Bobby' }));
      expect(a.equals(b)).toBe(false);
    });
  });
});
