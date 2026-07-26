import { describe, it, expect } from 'vitest';
import { Account } from '../account';
import { AccountStatus } from '../../value-objects/account-status';
import { IdentityId } from '@dailyuse/domain-shared/shared';

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function anAccount(overrides: { email?: string } = {}) {
  return Account.create({
    id: IdentityId.generate(),
    email: overrides.email ?? 'test@example.com',
  });
}

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

describe('Account', () => {
  // =========================================================================
  // create
  // =========================================================================
  describe('create', () => {
    it('should create an account with ACTIVE status', () => {
      const account = anAccount();
      expect(account.status).toBe(AccountStatus.Active);
    });

    it('should set default profile from email', () => {
      const account = anAccount({ email: 'john.doe@example.com' });
      expect(account.profile.nickname).toBe('john.doe');
    });

    it('should set default settings', () => {
      const account = anAccount();
      expect(account.settings).toBeDefined();
      expect(account.settings.notificationEnabled).toBe(true);
    });

    it('should create email contact as unverified', () => {
      const account = anAccount({ email: 'test@example.com' });
      expect(account.email.address).toBe('test@example.com');
      expect(account.email.isVerified).toBe(false);
    });

    it('should set phone to null', () => {
      const account = anAccount();
      expect(account.phone).toBeNull();
    });

    it('should set version to 1', () => {
      const account = anAccount();
      expect(account.version).toBe(1);
    });

    it('should set timestamps', () => {
      const before = Date.now();
      const account = anAccount();
      const after = Date.now();
      expect(Number(account.createdAt)).toBeGreaterThanOrEqual(before);
      expect(Number(account.createdAt)).toBeLessThanOrEqual(after);
      expect(Number(account.updatedAt)).toBeGreaterThanOrEqual(before);
    });

    it('should set deletedAt to null', () => {
      const account = anAccount();
      expect(account.deletedAt).toBeNull();
    });

    it('should emit account:create domain event', () => {
      const account = anAccount();
      const events = account.domainEvents;
      expect(events).toHaveLength(1);
      expect(events[0].eventType).toBe('account:created');
      expect(events[0].payload.accountId).toBe(account.id.toString());
      expect(events[0].payload.account.email.address).toBe(account.email.address);
    });
  });

  // =========================================================================
  // load
  // =========================================================================
  describe('load', () => {
    it('should reconstruct from saved state', () => {
      const original = anAccount({ email: 'loaded@example.com' });
      // Simulate persistence round-trip
      const loaded = Account.load({
        id: original.id as any,
        profile: original.profile,
        email: original.email,
        settings: original.settings,
        status: original.status,
        phone: original.phone,
        version: original.version,
        createdAt: original.createdAt,
        updatedAt: original.updatedAt,
        deletedAt: original.deletedAt,
      });
      expect(loaded.email.address).toBe('loaded@example.com');
      expect(loaded.domainEvents).toHaveLength(0); // no events on load
    });
  });

  // =========================================================================
  // close
  // =========================================================================
  describe('close', () => {
    it('should change status to DEACTIVATED', () => {
      const account = anAccount();
      account.close();
      expect(account.status).toBe(AccountStatus.Deactivated);
    });

    it('should emit account:close domain event', () => {
      const account = anAccount();
      account.clearDomainEvents(); // clear the create event
      account.close();
      const events = account.domainEvents;
      expect(events).toHaveLength(1);
      expect(events[0].eventType).toBe('account:closed');
      expect(events[0].payload.accountId).toBe(account.id.toString());
      expect(events[0].payload.account.status).toBe(AccountStatus.Deactivated);
    });

    it('should throw if already deactivated', () => {
      const account = anAccount();
      account.close();
      expect(() => account.close()).toThrow('Account is already closed.');
    });

    it('should throw if account is suspended', () => {
      // Need to load with suspended status since there is no suspend method
      const account = Account.load({
        id: IdentityId.generate() as any,
        profile: anAccount().profile,
        email: anAccount().email,
        settings: anAccount().settings,
        status: AccountStatus.Suspended,
        phone: null,
        version: 1,
        createdAt: Date.now(),
        updatedAt: Date.now(),
        deletedAt: null,
      });
      expect(() => account.close()).toThrow(
        'Cannot close a suspended account. Please contact support.',
      );
    });

    it('should update the updatedAt timestamp', () => {
      const account = anAccount();
      const before = account.updatedAt;
      // Small delay to ensure timestamp difference
      account.close();
      expect(Number(account.updatedAt)).toBeGreaterThanOrEqual(Number(before));
    });
  });

  // =========================================================================
  // updateProfile
  // =========================================================================
  describe('updateProfile', () => {
    it('should replace profile with a new one', () => {
      const account = anAccount({ email: 'update@example.com' });
      const newProfile = account.profile.updateNickname('NewName');
      account.updateProfile(newProfile);
      expect(account.profile.nickname).toBe('NewName');
    });

    it('should emit account:update-profile domain event', () => {
      const account = anAccount();
      account.clearDomainEvents();
      const newProfile = account.profile.updateNickname('Updated');
      account.updateProfile(newProfile);
      const events = account.domainEvents;
      expect(events).toHaveLength(1);
      expect(events[0].eventType).toBe('account:profile-updated');
      expect(events[0].payload.account.profile.nickname).toBe('Updated');
    });

    it('should refresh updatedAt', () => {
      const account = anAccount();
      const before = account.updatedAt;
      const newProfile = account.profile.updateBio('Hello');
      account.updateProfile(newProfile);
      expect(Number(account.updatedAt)).toBeGreaterThanOrEqual(Number(before));
    });
  });

  // =========================================================================
  // updateSettings
  // =========================================================================
  describe('updateSettings', () => {
    it('should replace settings with new ones', () => {
      const account = anAccount();
      const newSettings = account.settings.disableNotification();
      account.updateSettings(newSettings);
      expect(account.settings.notificationEnabled).toBe(false);
    });

    it('should emit account:update-settings domain event', () => {
      const account = anAccount();
      account.clearDomainEvents();
      const newSettings = account.settings.setTimezone('America/New_York');
      account.updateSettings(newSettings);
      const events = account.domainEvents;
      expect(events).toHaveLength(1);
      expect(events[0].eventType).toBe('account:settings-updated');
      expect(events[0].payload.account.settings.timezone).toBe('America/New_York');
    });
  });

  // =========================================================================
  // pullDomainEvents
  // =========================================================================
  describe('pullDomainEvents', () => {
    it('should return and clear domain events', () => {
      const account = anAccount();
      expect(account.domainEvents).toHaveLength(1);
      const pulled = account.pullDomainEvents();
      expect(pulled).toHaveLength(1);
      expect(account.domainEvents).toHaveLength(0);
    });
  });

  // =========================================================================
  // serialization
  // =========================================================================
  describe('toServerDTO', () => {
    it('should serialize all fields', () => {
      const account = anAccount({ email: 'dto@example.com' });
      const dto = account.toServerDTO();
      expect(dto.id).toBeDefined();
      expect(dto.status).toBe(AccountStatus.Active);
      expect(dto.profile).toBeDefined();
      expect(dto.settings).toBeDefined();
      expect(dto.email.address).toBe('dto@example.com');
      expect(dto.phone).toBeNull();
      expect(dto.version).toBe(1);
      expect(typeof dto.createdAt).toBe('number');
      expect(typeof dto.updatedAt).toBe('number');
      expect(dto.deletedAt).toBeNull();
    });
  });

  describe('toClientDTO', () => {
    it('should serialize all fields same as server DTO', () => {
      const account = anAccount();
      const serverDTO = account.toServerDTO();
      const clientDTO = account.toClientDTO();
      expect(clientDTO).toEqual(serverDTO);
    });
  });
});
