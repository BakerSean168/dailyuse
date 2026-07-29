import { describe, it, expect } from 'vitest';
import { NotificationPreference } from '../notification-preference';
import { NotificationChannelType } from '@memoflow/contracts/notification';

describe('NotificationPreference Aggregate Root', () => {
  const testIdentityId = 'test-identity-456';

  describe('create()', () => {
    it('should create a preference with empty settings when no defaults', () => {
      const pref = NotificationPreference.create({ identityId: testIdentityId });

      expect(pref.id).toBeTruthy();
      expect(pref.identityId).toBe(testIdentityId);
      expect(pref.settings.size).toBe(0);
      expect(pref.version).toBe(1);
    });

    it('should populate default modules when defaultChannels is provided', () => {
      const pref = NotificationPreference.create({
        identityId: testIdentityId,
        defaultChannels: [NotificationChannelType.InApp, NotificationChannelType.Email],
      });

      const expectedModules = ['task', 'goal', 'schedule', 'reminder', 'system'];
      for (const mod of expectedModules) {
        const channels = pref.getModuleChannels(mod);
        expect(channels).toContain(NotificationChannelType.InApp);
        expect(channels).toContain(NotificationChannelType.Email);
      }
    });

    it('should not populate modules when defaultChannels is empty', () => {
      const pref = NotificationPreference.create({
        identityId: testIdentityId,
        defaultChannels: [],
      });

      expect(pref.settings.size).toBe(0);
    });

    it('should set createdAt and updatedAt', () => {
      const pref = NotificationPreference.create({ identityId: testIdentityId });

      expect(pref.createdAt).toBeInstanceOf(Date);
      expect(pref.updatedAt).toBeInstanceOf(Date);
    });

    it('should have null deletedAt', () => {
      const pref = NotificationPreference.create({ identityId: testIdentityId });

      expect(pref.deletedAt).toBeNull();
    });
  });

  describe('getModuleChannels()', () => {
    it('should return channels for a configured module', () => {
      const pref = NotificationPreference.create({
        identityId: testIdentityId,
        defaultChannels: [NotificationChannelType.InApp],
      });

      const channels = pref.getModuleChannels('task');

      expect(channels).toEqual([NotificationChannelType.InApp]);
    });

    it('should return empty array for an unconfigured module', () => {
      const pref = NotificationPreference.create({ identityId: testIdentityId });

      const channels = pref.getModuleChannels('nonexistent');

      expect(channels).toEqual([]);
    });
  });

  describe('setModuleChannels()', () => {
    it('should set channels for a module', () => {
      const pref = NotificationPreference.create({ identityId: testIdentityId });

      pref.setModuleChannels('task', [NotificationChannelType.InApp, NotificationChannelType.Push]);

      expect(pref.getModuleChannels('task')).toEqual([
        NotificationChannelType.InApp,
        NotificationChannelType.Push,
      ]);
    });

    it('should overwrite existing channels', () => {
      const pref = NotificationPreference.create({
        identityId: testIdentityId,
        defaultChannels: [NotificationChannelType.InApp, NotificationChannelType.Email],
      });

      pref.setModuleChannels('task', [NotificationChannelType.Push]);

      expect(pref.getModuleChannels('task')).toEqual([NotificationChannelType.Push]);
    });

    it('should create a new module entry if not present', () => {
      const pref = NotificationPreference.create({ identityId: testIdentityId });

      pref.setModuleChannels('custom-module', [NotificationChannelType.Sms]);

      expect(pref.getModuleChannels('custom-module')).toEqual([NotificationChannelType.Sms]);
    });
  });

  describe('enableChannel()', () => {
    it('should add a channel to an existing module', () => {
      const pref = NotificationPreference.create({
        identityId: testIdentityId,
        defaultChannels: [NotificationChannelType.InApp],
      });

      pref.enableChannel('task', NotificationChannelType.Email);

      expect(pref.getModuleChannels('task')).toContain(NotificationChannelType.Email);
      expect(pref.getModuleChannels('task')).toContain(NotificationChannelType.InApp);
    });

    it('should not duplicate an already-enabled channel', () => {
      const pref = NotificationPreference.create({
        identityId: testIdentityId,
        defaultChannels: [NotificationChannelType.InApp],
      });

      pref.enableChannel('task', NotificationChannelType.InApp);

      const channels = pref.getModuleChannels('task');
      const inAppCount = channels.filter((c) => c === NotificationChannelType.InApp).length;
      expect(inAppCount).toBe(1);
    });

    it('should create module entry if not present', () => {
      const pref = NotificationPreference.create({ identityId: testIdentityId });

      pref.enableChannel('newModule', NotificationChannelType.Push);

      expect(pref.getModuleChannels('newModule')).toEqual([NotificationChannelType.Push]);
    });
  });

  describe('disableChannel()', () => {
    it('should remove a channel from a module', () => {
      const pref = NotificationPreference.create({
        identityId: testIdentityId,
        defaultChannels: [NotificationChannelType.InApp, NotificationChannelType.Email],
      });

      pref.disableChannel('task', NotificationChannelType.Email);

      expect(pref.getModuleChannels('task')).toEqual([NotificationChannelType.InApp]);
    });

    it('should not throw when disabling a non-existent channel', () => {
      const pref = NotificationPreference.create({
        identityId: testIdentityId,
        defaultChannels: [NotificationChannelType.InApp],
      });

      expect(() => pref.disableChannel('task', NotificationChannelType.Sms)).not.toThrow();
    });

    it('should not throw when disabling from a non-existent module', () => {
      const pref = NotificationPreference.create({ identityId: testIdentityId });

      expect(() => pref.disableChannel('nonexistent', NotificationChannelType.InApp)).not.toThrow();
    });
  });

  describe('disableModule()', () => {
    it('should set module channels to empty array', () => {
      const pref = NotificationPreference.create({
        identityId: testIdentityId,
        defaultChannels: [NotificationChannelType.InApp, NotificationChannelType.Email],
      });

      pref.disableModule('task');

      expect(pref.getModuleChannels('task')).toEqual([]);
    });

    it('should create empty entry for non-existent module', () => {
      const pref = NotificationPreference.create({ identityId: testIdentityId });

      pref.disableModule('some-module');

      expect(pref.getModuleChannels('some-module')).toEqual([]);
    });
  });

  describe('shouldSendNotification()', () => {
    it('should return true when the channel is enabled for the module', () => {
      const pref = NotificationPreference.create({
        identityId: testIdentityId,
        defaultChannels: [NotificationChannelType.InApp],
      });

      expect(pref.shouldSendNotification('task', NotificationChannelType.InApp)).toBe(true);
    });

    it('should return false when the channel is not enabled', () => {
      const pref = NotificationPreference.create({
        identityId: testIdentityId,
        defaultChannels: [NotificationChannelType.InApp],
      });

      expect(pref.shouldSendNotification('task', NotificationChannelType.Email)).toBe(false);
    });

    it('should return false for an unconfigured module', () => {
      const pref = NotificationPreference.create({ identityId: testIdentityId });

      expect(pref.shouldSendNotification('unknown', NotificationChannelType.InApp)).toBe(false);
    });

    it('should return false after disabling the module', () => {
      const pref = NotificationPreference.create({
        identityId: testIdentityId,
        defaultChannels: [NotificationChannelType.InApp],
      });
      pref.disableModule('task');

      expect(pref.shouldSendNotification('task', NotificationChannelType.InApp)).toBe(false);
    });
  });

  describe('toServerDTO()', () => {
    it('should convert Map settings to Record', () => {
      const pref = NotificationPreference.create({
        identityId: testIdentityId,
        defaultChannels: [NotificationChannelType.InApp],
      });

      const dto = pref.toServerDTO();

      expect(dto.id).toBeTruthy();
      expect(dto.identityId).toBe(testIdentityId);
      expect(dto.settings).toBeDefined();
      expect(dto.settings['task']).toEqual([NotificationChannelType.InApp]);
      expect(dto.version).toBe(1);
      expect(typeof dto.createdAt).toBe('number');
      expect(typeof dto.updatedAt).toBe('number');
      expect(dto.deletedAt).toBeNull();
    });

    it('should return empty settings record when no modules configured', () => {
      const pref = NotificationPreference.create({ identityId: testIdentityId });

      const dto = pref.toServerDTO();

      expect(Object.keys(dto.settings)).toHaveLength(0);
    });
  });

  describe('load()', () => {
    it('should reconstruct from state', () => {
      const original = NotificationPreference.create({
        identityId: testIdentityId,
        defaultChannels: [NotificationChannelType.InApp],
      });
      const state = {
        id: original.id,
        identityId: original.identityId,
        settings: new Map(original.settings),
        version: original.version,
        deletedAt: original.deletedAt,
        createdAt: original.createdAt,
        updatedAt: original.updatedAt,
      };

      const loaded = NotificationPreference.load(state);

      expect(String(loaded.id)).toBe(String(original.id));
      expect(loaded.identityId).toBe(testIdentityId);
      expect(loaded.shouldSendNotification('task', NotificationChannelType.InApp)).toBe(true);
    });
  });
});
