import { describe, it, expect } from 'vitest';
import { NotificationPolicy } from '../NotificationPolicy';
import { NotificationPreference } from '../../aggregates/notification-preference';
import { DoNotDisturbConfig } from '../../../domain-shared/value-objects/do-not-disturb-config';
import { RateLimit } from '../../../domain-shared/value-objects/rate-limit';
import { NotificationChannelType, NotificationCategory } from '@dailyuse/contracts/notification';
import { BusinessRuleViolationError } from '@dailyuse/utils';

describe('NotificationPolicy', () => {
  const policy = new NotificationPolicy();

  describe('assertCanSend()', () => {
    it('should not throw when no constraints are provided', () => {
      expect(() =>
        policy.assertCanSend({
          category: NotificationCategory.System,
          channel: NotificationChannelType.InApp,
        }),
      ).not.toThrow();
    });

    it('should not throw when preference allows the channel', () => {
      const pref = NotificationPreference.create({
        identityId: 'user-1',
        defaultChannels: [NotificationChannelType.InApp],
      });

      expect(() =>
        policy.assertCanSend({
          category: 'task' as NotificationCategory,
          channel: NotificationChannelType.InApp,
          preference: pref,
        }),
      ).not.toThrow();
    });

    it('should throw BusinessRuleViolationError when preference blocks the channel', () => {
      const pref = NotificationPreference.create({
        identityId: 'user-1',
        defaultChannels: [NotificationChannelType.InApp],
      });

      expect(() =>
        policy.assertCanSend({
          category: 'task' as NotificationCategory,
          channel: NotificationChannelType.Email,
          preference: pref,
        }),
      ).toThrow(BusinessRuleViolationError);
    });

    it('should throw when do-not-disturb is active', () => {
      const dnd = DoNotDisturbConfig.create({
        enabled: true,
        startTime: '00:00',
        endTime: '23:59',
        daysOfWeek: [0, 1, 2, 3, 4, 5, 6],
      });
      const now = new Date('2025-06-15T12:00:00');

      expect(() =>
        policy.assertCanSend({
          category: NotificationCategory.System,
          channel: NotificationChannelType.InApp,
          doNotDisturb: dnd,
          now,
        }),
      ).toThrow(BusinessRuleViolationError);
    });

    it('should not throw when do-not-disturb is inactive', () => {
      const dnd = DoNotDisturbConfig.create({
        enabled: false,
        startTime: '22:00',
        endTime: '08:00',
        daysOfWeek: [0, 1, 2, 3, 4, 5, 6],
      });

      expect(() =>
        policy.assertCanSend({
          category: NotificationCategory.System,
          channel: NotificationChannelType.InApp,
          doNotDisturb: dnd,
        }),
      ).not.toThrow();
    });

    it('should throw when rate limit is exceeded', () => {
      const rateLimit = RateLimit.create({
        enabled: true,
        maxPerHour: 5,
        maxPerDay: 20,
      });

      expect(() =>
        policy.assertCanSend({
          category: NotificationCategory.System,
          channel: NotificationChannelType.InApp,
          rateLimit,
          rateLimitUsage: { hourCount: 5, dayCount: 10 },
        }),
      ).toThrow(BusinessRuleViolationError);
    });

    it('should not throw when rate limit is not exceeded', () => {
      const rateLimit = RateLimit.create({
        enabled: true,
        maxPerHour: 10,
        maxPerDay: 50,
      });

      expect(() =>
        policy.assertCanSend({
          category: NotificationCategory.System,
          channel: NotificationChannelType.InApp,
          rateLimit,
          rateLimitUsage: { hourCount: 3, dayCount: 10 },
        }),
      ).not.toThrow();
    });

    it('should not check rate limit when disabled', () => {
      const rateLimit = RateLimit.createUnlimited();

      expect(() =>
        policy.assertCanSend({
          category: NotificationCategory.System,
          channel: NotificationChannelType.InApp,
          rateLimit,
          rateLimitUsage: { hourCount: 100, dayCount: 1000 },
        }),
      ).not.toThrow();
    });

    it('should not check rate limit when no usage is provided', () => {
      const rateLimit = RateLimit.create({
        enabled: true,
        maxPerHour: 1,
        maxPerDay: 1,
      });

      expect(() =>
        policy.assertCanSend({
          category: NotificationCategory.System,
          channel: NotificationChannelType.InApp,
          rateLimit,
          // no rateLimitUsage
        }),
      ).not.toThrow();
    });

    it('should throw when daily rate limit is exceeded', () => {
      const rateLimit = RateLimit.create({
        enabled: true,
        maxPerHour: 10,
        maxPerDay: 10,
      });

      expect(() =>
        policy.assertCanSend({
          category: NotificationCategory.System,
          channel: NotificationChannelType.InApp,
          rateLimit,
          rateLimitUsage: { hourCount: 1, dayCount: 10 },
        }),
      ).toThrow(BusinessRuleViolationError);
    });

    it('should check all constraints together — preference blocks', () => {
      const pref = NotificationPreference.create({
        identityId: 'user-1',
      });
      const dnd = DoNotDisturbConfig.createDefault();
      const rateLimit = RateLimit.createDefault();

      expect(() =>
        policy.assertCanSend({
          category: 'task' as NotificationCategory,
          channel: NotificationChannelType.InApp,
          preference: pref,
          doNotDisturb: dnd,
          rateLimit,
          rateLimitUsage: { hourCount: 0, dayCount: 0 },
        }),
      ).toThrow(BusinessRuleViolationError);
    });
  });
});
