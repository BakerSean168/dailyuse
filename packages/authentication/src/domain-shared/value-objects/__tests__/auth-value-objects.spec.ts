import { describe, expect, it, vi, afterEach } from 'vitest';
import { AuthIdentityStatus } from '../auth-identity-status';
import { CredentialStatus } from '../credential-status';
import { CredentialType } from '../credential-type';
import { DeviceType } from '../device-type';
import { PasswordAlgorithm } from '../password-algorithm';
import { SessionStatus } from '../session-status';
import { OAuthProvider } from '../oauth-provider';
import { EmailAddress } from '../email-address';
import { PhoneNumber } from '../phone-number';
import { PlainPassword } from '../plain-password';
import { HashedPassword } from '../hashed-password';
import { DeviceInfo } from '../device-info';

// ---------------------------------------------------------------------------
// Branded status / type companion objects
// ---------------------------------------------------------------------------

describe('AuthIdentityStatus', () => {
  it('exposes all constants', () => {
    expect(AuthIdentityStatus.Active).toBe('Active');
    expect(AuthIdentityStatus.Locked).toBe('Locked');
    expect(AuthIdentityStatus.Disabled).toBe('Disabled');
    expect(AuthIdentityStatus.Unverified).toBe('Unverified');
  });

  it('of() returns the value for valid inputs', () => {
    expect(AuthIdentityStatus.of('Active')).toBe('Active');
    expect(AuthIdentityStatus.of('Locked')).toBe('Locked');
  });

  it('of() throws for invalid input', () => {
    expect(() => AuthIdentityStatus.of('Unknown')).toThrow('Invalid identity status: Unknown');
  });

  it('isValid() returns true for valid values', () => {
    expect(AuthIdentityStatus.isValid('Active')).toBe(true);
    expect(AuthIdentityStatus.isValid('Unverified')).toBe(true);
  });

  it('isValid() returns false for invalid values', () => {
    expect(AuthIdentityStatus.isValid('invalid')).toBe(false);
    expect(AuthIdentityStatus.isValid('')).toBe(false);
  });

  it('getAll() returns all 4 statuses', () => {
    const all = AuthIdentityStatus.getAll();
    expect(all).toHaveLength(4);
    expect(all).toContain('Active');
    expect(all).toContain('Locked');
    expect(all).toContain('Disabled');
    expect(all).toContain('Unverified');
  });

  it('behavior: isVerified / isActive', () => {
    expect(AuthIdentityStatus.isVerified(AuthIdentityStatus.Active)).toBe(true);
    expect(AuthIdentityStatus.isActive(AuthIdentityStatus.Active)).toBe(true);
    expect(AuthIdentityStatus.isActive(AuthIdentityStatus.Locked)).toBe(false);
  });

  it('behavior: isUnverified / isDisabled / isLocked', () => {
    expect(AuthIdentityStatus.isUnverified(AuthIdentityStatus.Unverified)).toBe(true);
    expect(AuthIdentityStatus.isDisabled(AuthIdentityStatus.Disabled)).toBe(true);
    expect(AuthIdentityStatus.isLocked(AuthIdentityStatus.Locked)).toBe(true);
  });

  it('behavior: isInactive', () => {
    expect(AuthIdentityStatus.isInactive(AuthIdentityStatus.Locked)).toBe(true);
    expect(AuthIdentityStatus.isInactive(AuthIdentityStatus.Disabled)).toBe(true);
    expect(AuthIdentityStatus.isInactive(AuthIdentityStatus.Unverified)).toBe(true);
    expect(AuthIdentityStatus.isInactive(AuthIdentityStatus.Active)).toBe(false);
  });

  it('behavior: requiresUserAction / requiresAdminAction', () => {
    expect(AuthIdentityStatus.requiresUserAction(AuthIdentityStatus.Unverified)).toBe(true);
    expect(AuthIdentityStatus.requiresUserAction(AuthIdentityStatus.Active)).toBe(false);
    expect(AuthIdentityStatus.requiresAdminAction(AuthIdentityStatus.Locked)).toBe(true);
    expect(AuthIdentityStatus.requiresAdminAction(AuthIdentityStatus.Disabled)).toBe(true);
    expect(AuthIdentityStatus.requiresAdminAction(AuthIdentityStatus.Active)).toBe(false);
  });
});

describe('CredentialStatus', () => {
  it('exposes all constants', () => {
    expect(CredentialStatus.Active).toBe('Active');
    expect(CredentialStatus.Suspended).toBe('Suspended');
    expect(CredentialStatus.Expired).toBe('Expired');
    expect(CredentialStatus.Revoked).toBe('Revoked');
  });

  it('of() validates correctly', () => {
    expect(CredentialStatus.of('Active')).toBe('Active');
    expect(() => CredentialStatus.of('Banned')).toThrow('Invalid credential status: Banned');
  });

  it('isValid() and getAll()', () => {
    expect(CredentialStatus.isValid('Suspended')).toBe(true);
    expect(CredentialStatus.isValid('bad')).toBe(false);
    expect(CredentialStatus.getAll()).toHaveLength(4);
  });

  it('behavior: isActive / isSuspended / isExpired / isRevoked', () => {
    expect(CredentialStatus.isActive(CredentialStatus.Active)).toBe(true);
    expect(CredentialStatus.isSuspended(CredentialStatus.Suspended)).toBe(true);
    expect(CredentialStatus.isExpired(CredentialStatus.Expired)).toBe(true);
    expect(CredentialStatus.isRevoked(CredentialStatus.Revoked)).toBe(true);
  });

  it('behavior: isUsable includes Active and Suspended', () => {
    expect(CredentialStatus.isUsable(CredentialStatus.Active)).toBe(true);
    expect(CredentialStatus.isUsable(CredentialStatus.Suspended)).toBe(true);
    expect(CredentialStatus.isUsable(CredentialStatus.Expired)).toBe(false);
    expect(CredentialStatus.isUsable(CredentialStatus.Revoked)).toBe(false);
  });

  it('behavior: isInvalid means expired or revoked', () => {
    expect(CredentialStatus.isInvalid(CredentialStatus.Expired)).toBe(true);
    expect(CredentialStatus.isInvalid(CredentialStatus.Revoked)).toBe(true);
    expect(CredentialStatus.isInvalid(CredentialStatus.Active)).toBe(false);
  });
});

describe('CredentialType', () => {
  it('exposes all constants', () => {
    expect(CredentialType.Password).toBe('Password');
    expect(CredentialType.MagicLink).toBe('MagicLink');
  });

  it('of() validates correctly', () => {
    expect(CredentialType.of('Password')).toBe('Password');
    expect(CredentialType.of('MagicLink')).toBe('MagicLink');
    expect(() => CredentialType.of('OAuth')).toThrow('Invalid credential type: OAuth');
  });

  it('isValid() and getAll()', () => {
    expect(CredentialType.isValid('Password')).toBe(true);
    expect(CredentialType.isValid('Unknown')).toBe(false);
    expect(CredentialType.getAll()).toHaveLength(2);
  });

  it('behavior: isPasswordBased / isMagicLink / requiresServerVerification', () => {
    expect(CredentialType.isPasswordBased(CredentialType.Password)).toBe(true);
    expect(CredentialType.isPasswordBased(CredentialType.MagicLink)).toBe(false);
    expect(CredentialType.isMagicLink(CredentialType.MagicLink)).toBe(true);
    expect(CredentialType.requiresServerVerification(CredentialType.Password)).toBe(true);
    expect(CredentialType.requiresServerVerification(CredentialType.MagicLink)).toBe(true);
  });
});

describe('DeviceType', () => {
  it('exposes all constants', () => {
    expect(DeviceType.Desktop).toBe('Desktop');
    expect(DeviceType.Mobile).toBe('Mobile');
    expect(DeviceType.Tablet).toBe('Tablet');
    expect(DeviceType.Browser).toBe('Browser');
    expect(DeviceType.Api).toBe('Api');
    expect(DeviceType.Unknown).toBe('Unknown');
  });

  it('of() validates correctly', () => {
    expect(DeviceType.of('Mobile')).toBe('Mobile');
    expect(() => DeviceType.of('Watch')).toThrow('Invalid device type: Watch');
  });

  it('isValid() and getAll()', () => {
    expect(DeviceType.isValid('Browser')).toBe(true);
    expect(DeviceType.isValid('TV')).toBe(false);
    expect(DeviceType.getAll()).toHaveLength(6);
  });

  it('behavior: isMobile / isBrowser / isDesktop / isTablet / isSmallScreen', () => {
    expect(DeviceType.isMobile(DeviceType.Mobile)).toBe(true);
    expect(DeviceType.isMobile(DeviceType.Desktop)).toBe(false);
    expect(DeviceType.isBrowser(DeviceType.Browser)).toBe(true);
    expect(DeviceType.isDesktop(DeviceType.Desktop)).toBe(true);
    expect(DeviceType.isTablet(DeviceType.Tablet)).toBe(true);
    expect(DeviceType.isSmallScreen(DeviceType.Mobile)).toBe(true);
    expect(DeviceType.isSmallScreen(DeviceType.Tablet)).toBe(true);
    expect(DeviceType.isSmallScreen(DeviceType.Desktop)).toBe(false);
  });
});

describe('PasswordAlgorithm', () => {
  it('exposes all constants', () => {
    expect(PasswordAlgorithm.Bcrypt).toBe('Bcrypt');
    expect(PasswordAlgorithm.Argon2).toBe('Argon2');
    expect(PasswordAlgorithm.Scrypt).toBe('Scrypt');
  });

  it('of() validates correctly', () => {
    expect(PasswordAlgorithm.of('Argon2')).toBe('Argon2');
    expect(() => PasswordAlgorithm.of('MD5')).toThrow('Invalid password algorithm: MD5');
  });

  it('isValid() and getAll()', () => {
    expect(PasswordAlgorithm.isValid('Bcrypt')).toBe(true);
    expect(PasswordAlgorithm.isValid('SHA256')).toBe(false);
    expect(PasswordAlgorithm.getAll()).toHaveLength(3);
  });

  it('behavior: isBcrypt / isArgon2 / isScrypt', () => {
    expect(PasswordAlgorithm.isBcrypt(PasswordAlgorithm.Bcrypt)).toBe(true);
    expect(PasswordAlgorithm.isArgon2(PasswordAlgorithm.Argon2)).toBe(true);
    expect(PasswordAlgorithm.isScrypt(PasswordAlgorithm.Scrypt)).toBe(true);
  });

  it('behavior: isSecure marks Bcrypt and Argon2 as secure', () => {
    expect(PasswordAlgorithm.isSecure(PasswordAlgorithm.Bcrypt)).toBe(true);
    expect(PasswordAlgorithm.isSecure(PasswordAlgorithm.Argon2)).toBe(true);
    expect(PasswordAlgorithm.isSecure(PasswordAlgorithm.Scrypt)).toBe(false);
  });

  it('behavior: isDeprecated marks Scrypt as deprecated', () => {
    expect(PasswordAlgorithm.isDeprecated(PasswordAlgorithm.Scrypt)).toBe(true);
    expect(PasswordAlgorithm.isDeprecated(PasswordAlgorithm.Argon2)).toBe(false);
  });

  it('getRecommendedCost returns the right cost per algorithm', () => {
    expect(PasswordAlgorithm.getRecommendedCost(PasswordAlgorithm.Bcrypt)).toBe(12);
    expect(PasswordAlgorithm.getRecommendedCost(PasswordAlgorithm.Argon2)).toBe(3);
    expect(PasswordAlgorithm.getRecommendedCost(PasswordAlgorithm.Scrypt)).toBe(100000);
  });
});

describe('SessionStatus', () => {
  it('exposes all constants', () => {
    expect(SessionStatus.Active).toBe('Active');
    expect(SessionStatus.Expired).toBe('Expired');
    expect(SessionStatus.Revoked).toBe('Revoked');
  });

  it('of() validates correctly', () => {
    expect(SessionStatus.of('Active')).toBe('Active');
    expect(() => SessionStatus.of('Pending')).toThrow('Invalid session status: Pending');
  });

  it('isValid() and getAll()', () => {
    expect(SessionStatus.isValid('Revoked')).toBe(true);
    expect(SessionStatus.isValid('zombie')).toBe(false);
    expect(SessionStatus.getAll()).toHaveLength(3);
  });

  it('behavior: isActive / isExpired / isRevoked / isTerminated / isRecoverable', () => {
    expect(SessionStatus.isActive(SessionStatus.Active)).toBe(true);
    expect(SessionStatus.isExpired(SessionStatus.Expired)).toBe(true);
    expect(SessionStatus.isRevoked(SessionStatus.Revoked)).toBe(true);
    expect(SessionStatus.isTerminated(SessionStatus.Expired)).toBe(true);
    expect(SessionStatus.isTerminated(SessionStatus.Revoked)).toBe(true);
    expect(SessionStatus.isTerminated(SessionStatus.Active)).toBe(false);
    expect(SessionStatus.isRecoverable(SessionStatus.Expired)).toBe(false);
  });
});

describe('OAuthProvider', () => {
  it('exposes all constants', () => {
    expect(OAuthProvider.Google).toBe('Google');
    expect(OAuthProvider.Facebook).toBe('Facebook');
    expect(OAuthProvider.Github).toBe('Github');
    expect(OAuthProvider.Apple).toBe('Apple');
    expect(OAuthProvider.Wechat).toBe('Wechat');
    expect(OAuthProvider.Weibo).toBe('Weibo');
  });

  it('of() validates correctly', () => {
    expect(OAuthProvider.of('Google')).toBe('Google');
    expect(OAuthProvider.of('Github')).toBe('Github');
    expect(() => OAuthProvider.of('Twitter')).toThrow();
  });

  it('isValid() returns true for valid providers', () => {
    expect(OAuthProvider.isValid('Wechat')).toBe(true);
    expect(OAuthProvider.isValid('unknown')).toBe(false);
  });

  it('getAll() returns all 6 providers', () => {
    const all = OAuthProvider.getAll();
    expect(all).toHaveLength(6);
    expect(all).toContain('Google');
    expect(all).toContain('Weibo');
  });
});

// ---------------------------------------------------------------------------
// Complex Value Objects
// ---------------------------------------------------------------------------

describe('EmailAddress', () => {
  describe('create()', () => {
    it('accepts valid email', () => {
      const email = EmailAddress.create({ value: 'user@example.com' });
      expect(email.value).toBe('user@example.com');
    });

    it('rejects invalid email format', () => {
      expect(() => EmailAddress.create({ value: 'not-an-email' })).toThrow('Invalid email address format');
    });

    it('rejects email without domain', () => {
      expect(() => EmailAddress.create({ value: 'user@' })).toThrow();
    });

    it('rejects email over 254 characters', () => {
      const longEmail = 'a'.repeat(64) + '@' + 'b'.repeat(186) + '.com';
      expect(() => EmailAddress.create({ value: longEmail })).toThrow('too long');
    });

    it('rejects local part over 64 characters', () => {
      const longLocal = 'a'.repeat(65) + '@example.com';
      expect(() => EmailAddress.create({ value: longLocal })).toThrow('local part too long');
    });
  });

  describe('fromDTO()', () => {
    it('restores without validation', () => {
      const email = EmailAddress.fromDTO({ value: 'test@test.com' });
      expect(email.value).toBe('test@test.com');
    });
  });

  describe('computed properties', () => {
    const email = EmailAddress.create({ value: 'john.doe@gmail.com' });

    it('domain() extracts domain part', () => {
      expect(email.domain()).toBe('gmail.com');
    });

    it('getLocalPart() extracts local part', () => {
      expect(email.getLocalPart()).toBe('john.doe');
    });

    it('getMaskedAddress() masks the middle', () => {
      const masked = email.getMaskedAddress();
      expect(masked).toContain('@gmail.com');
      expect(masked).toContain('*');
    });

    it('isFreeEmail() recognizes gmail.com', () => {
      expect(email.isFreeEmail()).toBe(true);
    });

    it('isCorporateEmail() is the inverse of isFreeEmail', () => {
      const corp = EmailAddress.create({ value: 'hr@company.io' });
      expect(corp.isCorporateEmail()).toBe(true);
      expect(corp.isFreeEmail()).toBe(false);
    });
  });

  describe('serialization', () => {
    const email = EmailAddress.create({ value: 'user@example.com' });

    it('toDTO() round-trips', () => {
      expect(email.toDTO()).toEqual({ value: 'user@example.com' });
    });

    it('toPersistence() matches toDTO for email', () => {
      expect(email.toPersistence()).toEqual({ value: 'user@example.com' });
    });
  });
});

describe('PhoneNumber', () => {
  describe('create()', () => {
    it('accepts valid China mobile numbers', () => {
      const phone = PhoneNumber.create({ value: '13800138000' });
      expect(phone.value).toBe('13800138000');
    });

    it('rejects invalid format', () => {
      expect(() => PhoneNumber.create({ value: '12345' })).toThrow('Invalid phone number format');
    });

    it('rejects numbers not starting with 1[3-9]', () => {
      expect(() => PhoneNumber.create({ value: '12012345678' })).toThrow();
    });
  });

  describe('fromDTO()', () => {
    it('restores without re-validating', () => {
      const phone = PhoneNumber.fromDTO({ value: '13900139000' });
      expect(phone.value).toBe('13900139000');
    });
  });

  describe('computed properties', () => {
    const phone = PhoneNumber.create({ value: '13812345678' });

    it('getDigitsOnly() strips non-digits', () => {
      expect(phone.getDigitsOnly()).toBe('13812345678');
    });

    it('getCountryCode() defaults to 86 for China numbers', () => {
      expect(phone.getCountryCode()).toBe('86');
    });

    it('getMaskedNumber() hides middle digits', () => {
      expect(phone.getMaskedNumber()).toMatch(/^138\*+5678$/);
    });

    it('isChinaMainland() returns true', () => {
      expect(phone.isChinaMainland()).toBe(true);
    });

    it('getCarrier() identifies China Mobile for 138 prefix', () => {
      expect(phone.getCarrier()).toBe('ChinaMobile');
    });

    it('getCarrier() identifies China Unicom for 130 prefix', () => {
      const unicom = PhoneNumber.create({ value: '13000000000' });
      expect(unicom.getCarrier()).toBe('ChinaUnicom');
    });

    it('getCarrier() identifies China Telecom for 133 prefix', () => {
      const telecom = PhoneNumber.create({ value: '13312345678' });
      expect(telecom.getCarrier()).toBe('ChinaTelecom');
    });
  });

  describe('serialization', () => {
    it('toDTO() and toPersistence() match', () => {
      const phone = PhoneNumber.create({ value: '13800138000' });
      expect(phone.toDTO()).toEqual({ value: '13800138000' });
      expect(phone.toPersistence()).toEqual({ value: '13800138000' });
    });
  });
});

describe('PlainPassword', () => {
  describe('create()', () => {
    it('accepts a valid strong password', () => {
      const pwd = PlainPassword.create({ value: 'StrongP@ss1' });
      expect(pwd.value).toBe('StrongP@ss1');
    });

    it('rejects empty password', () => {
      expect(() => PlainPassword.create({ value: '' })).toThrow('Password cannot be empty');
      expect(() => PlainPassword.create({ value: '   ' })).toThrow('Password cannot be empty');
    });

    it('rejects password shorter than 8 characters', () => {
      expect(() => PlainPassword.create({ value: 'Ab1@' })).toThrow('at least 8 characters');
    });

    it('rejects password longer than 128 characters', () => {
      const long = 'Aa1@' + 'x'.repeat(125);
      expect(() => PlainPassword.create({ value: long })).toThrow('not exceed 128 characters');
    });

    it('rejects passwords with insufficient complexity', () => {
      expect(() => PlainPassword.create({ value: 'alllowercase' })).toThrow('at least 2');
    });

    it('accepts a password with only uppercase + digit (2 categories)', () => {
      const pwd = PlainPassword.create({ value: 'UPPERCASE123' });
      expect(pwd.value).toBe('UPPERCASE123');
    });
  });

  describe('getStrength()', () => {
    it('rates a short simple password as Weak', () => {
      const pwd = PlainPassword.create({ value: 'Abcdef12' });
      expect(['Weak', 'Fair', 'Good', 'Strong']).toContain(pwd.getStrength());
    });

    it('rates a complex long password as Strong', () => {
      const pwd = PlainPassword.create({ value: 'Tr0ub4dor&3SuperLong!' });
      expect(pwd.getStrength()).toBe('Strong');
    });
  });

  describe('getStrengthPercentage()', () => {
    it('returns a value between 0 and 100', () => {
      const pwd = PlainPassword.create({ value: 'StrongP@ss1' });
      const pct = pwd.getStrengthPercentage();
      expect(pct).toBeGreaterThan(0);
      expect(pct).toBeLessThanOrEqual(100);
    });
  });

  describe('hasCommonPatterns()', () => {
    it('detects common patterns', () => {
      const pwd = PlainPassword.create({ value: 'Password123!' });
      expect(pwd.hasCommonPatterns()).toBe(true);
    });

    it('returns false for non-common passwords', () => {
      const pwd = PlainPassword.create({ value: 'Xk9#mQ2vL!' });
      expect(pwd.hasCommonPatterns()).toBe(false);
    });
  });
});

describe('HashedPassword', () => {
  const VALID_HASH = '$argon2id$v=19$m=65536,t=3,p=4$bW9ja3NhbHQ$bW9ja2hhc2h2YWx1ZQ';
  const VALID_DTO = {
    hash: VALID_HASH,
    salt: 'bW9ja3NhbHQ',
    algorithm: 'Argon2' as const,
    createdAt: Date.now(),
  };

  afterEach(() => {
    vi.useRealTimers();
  });

  describe('fromDTO()', () => {
    it('restores from DTO', () => {
      const hp = HashedPassword.fromDTO(VALID_DTO);
      expect(hp.hash).toBe(VALID_HASH);
      expect(hp.salt).toBe('bW9ja3NhbHQ');
      expect(hp.algorithm).toBe('Argon2');
    });
  });

  describe('fromPersistence()', () => {
    it('converts Date timestamps', () => {
      const dto = {
        hash: VALID_HASH,
        salt: 'salt123',
        algorithm: 'Argon2' as const,
        createdAt: new Date('2024-01-01'),
      };
      const hp = HashedPassword.fromPersistence(dto);
      expect(hp.createdAt).toBe(new Date('2024-01-01').getTime());
    });
  });

  describe('createPlaceholder()', () => {
    it('creates a placeholder with empty hash and salt', () => {
      const hp = HashedPassword.createPlaceholder();
      expect(hp.hash).toBe('');
      expect(hp.salt).toBe('');
      expect(hp.algorithm).toBe('Argon2');
    });
  });

  describe('algorithm checks', () => {
    it('usesModernAlgorithm() is true for Argon2', () => {
      const hp = HashedPassword.fromDTO(VALID_DTO);
      expect(hp.usesModernAlgorithm()).toBe(true);
    });

    it('usesDeprecatedAlgorithm() is false for Argon2', () => {
      const hp = HashedPassword.fromDTO(VALID_DTO);
      expect(hp.usesDeprecatedAlgorithm()).toBe(false);
    });

    it('shouldMigrateAlgorithm() is false for Argon2', () => {
      const hp = HashedPassword.fromDTO(VALID_DTO);
      expect(hp.shouldMigrateAlgorithm()).toBe(false);
    });

    it('usesDeprecatedAlgorithm() is true for Scrypt', () => {
      const hp = HashedPassword.fromDTO({ ...VALID_DTO, algorithm: 'Scrypt' });
      expect(hp.usesDeprecatedAlgorithm()).toBe(true);
    });
  });

  describe('getDaysSinceCreation() and needsReset()', () => {
    it('returns 0 for a freshly created hash', () => {
      vi.useFakeTimers();
      const now = new Date('2026-01-01T12:00:00Z');
      vi.setSystemTime(now);
      const hp = HashedPassword.fromDTO({ ...VALID_DTO, createdAt: now.getTime() });
      expect(hp.getDaysSinceCreation()).toBe(0);
      expect(hp.needsReset()).toBe(false);
    });

    it('returns 91 after 91 days', () => {
      vi.useFakeTimers();
      const created = new Date('2026-01-01T12:00:00Z');
      vi.setSystemTime(new Date('2026-04-02T12:00:00Z')); // 91 days later
      const hp = HashedPassword.fromDTO({ ...VALID_DTO, createdAt: created.getTime() });
      expect(hp.getDaysSinceCreation()).toBe(91);
      expect(hp.needsReset()).toBe(true);
    });
  });

  describe('updateHash()', () => {
    it('returns a new instance with the updated hash', () => {
      const hp = HashedPassword.fromDTO(VALID_DTO);
      const newHash = HashedPassword.fromDTO({
        ...VALID_DTO,
        hash: '$argon2id$v=19$m=65536,t=3,p=4$newSalt$newHash',
        salt: 'newSalt',
      });
      const updated = hp.updateHash(newHash.hash, newHash.salt, 'Argon2');
      expect(updated.hash).toBe(newHash.hash);
      expect(updated.salt).toBe('newSalt');
      expect(updated).not.toBe(hp);
    });
  });

  describe('serialization', () => {
    it('toDTO() round-trips', () => {
      const hp = HashedPassword.fromDTO(VALID_DTO);
      const dto = hp.toDTO();
      expect(dto.hash).toBe(VALID_HASH);
      expect(dto.salt).toBe('bW9ja3NhbHQ');
    });

    it('toPersistence() converts timestamp to Date', () => {
      const hp = HashedPassword.fromDTO(VALID_DTO);
      const p = hp.toPersistence();
      expect(p.createdAt).toBeInstanceOf(Date);
    });
  });
});

describe('DeviceInfo', () => {
  const BASE_PROPS = {
    deviceId: 'device-001',
    deviceFingerprint: 'fp-abc',
    deviceType: 'Browser' as const,
    deviceName: null,
    os: null,
    osVersion: null,
    browser: 'Chrome',
    appVersion: null,
    ipAddress: '192.168.1.1',
    userAgent: null,
    location: null,
    firstSeenAt: Date.now(),
    lastSeenAt: Date.now(),
  };

  afterEach(() => {
    vi.useRealTimers();
  });

  describe('create()', () => {
    it('creates from valid props', () => {
      const info = DeviceInfo.create(BASE_PROPS);
      expect(info.deviceId).toBe('device-001');
      expect(info.browser).toBe('Chrome');
    });

    it('rejects invalid device type', () => {
      expect(() => DeviceInfo.create({ ...BASE_PROPS, deviceType: 'Watch' as any })).toThrow('Invalid device type');
    });

    it('rejects empty deviceName string', () => {
      expect(() => DeviceInfo.create({ ...BASE_PROPS, deviceName: '' })).toThrow('Device name cannot be empty');
    });

    it('rejects deviceName over 100 characters', () => {
      expect(() => DeviceInfo.create({ ...BASE_PROPS, deviceName: 'x'.repeat(101) })).toThrow('Device name too long');
    });

    it('rejects userAgent over 500 characters', () => {
      expect(() => DeviceInfo.create({ ...BASE_PROPS, userAgent: 'u'.repeat(501) })).toThrow('User agent too long');
    });

    it('rejects invalid IP address', () => {
      expect(() => DeviceInfo.create({ ...BASE_PROPS, ipAddress: 'not-an-ip' })).toThrow('Invalid IP address format');
    });

    it('rejects lastSeenAt earlier than firstSeenAt', () => {
      const now = Date.now();
      expect(() => DeviceInfo.create({
        ...BASE_PROPS,
        firstSeenAt: now,
        lastSeenAt: now - 1000,
      })).toThrow('lastSeenAt cannot be earlier than firstSeenAt');
    });
  });

  describe('createDefault()', () => {
    it('creates a minimal device with Browser type', () => {
      const info = DeviceInfo.createDefault('device-default');
      expect(info.deviceId).toBe('device-default');
      expect(info.deviceType).toBe('Browser');
      expect(info.deviceName).toBeNull();
    });
  });

  describe('fromDTO()', () => {
    it('restores from DTO', () => {
      const info = DeviceInfo.fromDTO(BASE_PROPS);
      expect(info.deviceId).toBe('device-001');
    });

    it('handles passing a DeviceInfo instance directly', () => {
      const original = DeviceInfo.create(BASE_PROPS);
      const copy = DeviceInfo.fromDTO(original as any);
      expect(copy.deviceId).toBe(original.deviceId);
    });
  });

  describe('device type classification', () => {
    it('isBrowser() for Browser type', () => {
      const info = DeviceInfo.create(BASE_PROPS);
      expect(info.isBrowser()).toBe(true);
      expect(info.isMobile()).toBe(false);
    });

    it('isMobile() for Mobile type', () => {
      const info = DeviceInfo.create({ ...BASE_PROPS, deviceType: 'Mobile', ipAddress: null });
      expect(info.isMobile()).toBe(true);
    });
  });

  describe('time-based computed properties', () => {
    it('isNewDevice() returns true when first seen today', () => {
      vi.useFakeTimers();
      const now = new Date('2026-01-15T12:00:00Z');
      vi.setSystemTime(now);
      const info = DeviceInfo.create({ ...BASE_PROPS, firstSeenAt: now.getTime(), lastSeenAt: now.getTime() });
      expect(info.isNewDevice()).toBe(true);
      expect(info.isFamiliar()).toBe(false);
    });

    it('isFamiliar() returns true after 7 days', () => {
      vi.useFakeTimers();
      const firstSeen = new Date('2026-01-01T12:00:00Z').getTime();
      vi.setSystemTime(new Date('2026-01-10T12:00:00Z'));
      const info = DeviceInfo.create({ ...BASE_PROPS, firstSeenAt: firstSeen, lastSeenAt: firstSeen });
      expect(info.isFamiliar()).toBe(true);
    });

    it('isInactive() returns true after 31 days without activity', () => {
      vi.useFakeTimers();
      const lastSeen = new Date('2025-12-01T12:00:00Z').getTime();
      vi.setSystemTime(new Date('2026-01-10T12:00:00Z'));
      const info = DeviceInfo.create({ ...BASE_PROPS, firstSeenAt: lastSeen, lastSeenAt: lastSeen });
      expect(info.isInactive()).toBe(true);
    });

    it('getDaysSinceFirstSeen() computes correctly', () => {
      vi.useFakeTimers();
      const firstSeen = new Date('2026-01-01T00:00:00Z').getTime();
      vi.setSystemTime(new Date('2026-01-06T00:00:00Z'));
      const info = DeviceInfo.create({ ...BASE_PROPS, firstSeenAt: firstSeen, lastSeenAt: firstSeen });
      expect(info.getDaysSinceFirstSeen()).toBe(5);
    });

    it('getAgeDescription() returns human-readable string', () => {
      vi.useFakeTimers();
      const firstSeen = new Date('2026-01-01T00:00:00Z').getTime();
      vi.setSystemTime(new Date('2026-01-06T00:00:00Z'));
      const info = DeviceInfo.create({ ...BASE_PROPS, firstSeenAt: firstSeen, lastSeenAt: firstSeen });
      expect(info.getAgeDescription()).toContain('days ago');
    });

    it('getLastActivityDescription() returns "Today" for same day', () => {
      vi.useFakeTimers();
      const now = new Date('2026-01-15T12:00:00Z').getTime();
      vi.setSystemTime(new Date('2026-01-15T15:00:00Z'));
      const info = DeviceInfo.create({ ...BASE_PROPS, firstSeenAt: now, lastSeenAt: now });
      expect(info.getLastActivityDescription()).toBe('Today');
    });
  });

  describe('mutations', () => {
    it('rename() returns a new DeviceInfo with updated name', () => {
      const info = DeviceInfo.create(BASE_PROPS);
      const renamed = info.rename('My Laptop');
      expect(renamed.deviceName).toBe('My Laptop');
      expect(info.deviceName).toBeNull();
    });

    it('updateLastSeen() returns a new instance with updated timestamp', () => {
      vi.useFakeTimers();
      const firstSeen = new Date('2026-01-01T00:00:00Z').getTime();
      vi.setSystemTime(new Date('2026-01-10T00:00:00Z'));
      const info = DeviceInfo.create({ ...BASE_PROPS, firstSeenAt: firstSeen, lastSeenAt: firstSeen });
      const updated = info.updateLastSeen();
      expect(updated.lastSeenAt).toBeGreaterThan(info.lastSeenAt);
    });
  });

  describe('serialization', () => {
    it('toDTO() returns a plain object', () => {
      const info = DeviceInfo.create(BASE_PROPS);
      const dto = info.toDTO();
      expect(dto.deviceId).toBe('device-001');
      expect(dto.ipAddress).toBe('192.168.1.1');
    });

    it('toPersistence() converts timestamps to Date', () => {
      const info = DeviceInfo.create(BASE_PROPS);
      const p = info.toPersistence();
      expect(p.firstSeenAt).toBeInstanceOf(Date);
      expect(p.lastSeenAt).toBeInstanceOf(Date);
    });
  });
});
