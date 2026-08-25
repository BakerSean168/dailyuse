import { describe, it, expect } from 'vitest';
import { NotificationPolicy } from '../notification-policy';
import { NotificationPreference } from '../../aggregates/notification-preference';
import { DoNotDisturbConfig } from '../../value-objects/do-not-disturb-config';
import { RateLimit } from '../../value-objects/rate-limit';
import { NotificationChannelType, NotificationCategory } from '@memoflow/contracts/notification';
import { BusinessRuleViolationError } from '@memoflow/utils/errors';

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
  describe('evaluate()', () => {
    it('returns a per-channel suppression reason for disabled preferences', () => {
      const pref = NotificationPreference.create({ identityId: 'user-1' });
      pref.setModuleChannels(NotificationCategory.System, [NotificationChannelType.InApp]);

      expect(
        policy.evaluate({
          category: NotificationCategory.System,
          channel: NotificationChannelType.Email,
          preference: pref,
        }),
      ).toEqual({
        channel: NotificationChannelType.Email,
        outcome: 'suppressed',
        reason: 'user_preference_disabled',
      });
    });

    it('returns deferred with retryAt while DND is active and deliver_now at the end boundary', () => {
      const dnd = DoNotDisturbConfig.create({
        enabled: true,
        startTime: '22:00',
        endTime: '08:00',
        daysOfWeek: [0, 1, 2, 3, 4, 5, 6],
      });
      const activeAt = new Date('2026-08-25T23:30:00');
      const activeDecision = policy.evaluate({
        category: NotificationCategory.System,
        channel: NotificationChannelType.InApp,
        doNotDisturb: dnd,
        now: activeAt,
      });

      expect(activeDecision).toMatchObject({
        outcome: 'deferred',
        reason: 'dnd_active',
      });
      expect(activeDecision.retryAt?.toISOString()).toBe(dnd.nextInactiveAt(activeAt)?.toISOString());

      const endedDecision = policy.evaluate({
        category: NotificationCategory.System,
        channel: NotificationChannelType.InApp,
        doNotDisturb: dnd,
        now: new Date('2026-08-26T08:00:00'),
      });
      expect(endedDecision).toMatchObject({ outcome: 'deliver_now', reason: 'allowed' });
    });

    it('only bypasses DND when the caller explicitly opts in', () => {
      const dnd = DoNotDisturbConfig.create({
        enabled: true,
        startTime: '00:00',
        endTime: '23:59',
        daysOfWeek: [0, 1, 2, 3, 4, 5, 6],
      });
      const decision = policy.evaluate({
        category: NotificationCategory.System,
        channel: NotificationChannelType.InApp,
        doNotDisturb: dnd,
        now: new Date('2026-08-25T12:00:00'),
        bypassDoNotDisturb: true,
      });

      expect(decision).toMatchObject({ outcome: 'deliver_now', reason: 'allowed' });
    });

    it('distinguishes hourly and daily rate-limit reasons and resets when usage drops', () => {
      const rateLimit = RateLimit.create({ enabled: true, maxPerHour: 2, maxPerDay: 5 });

      expect(
        policy.evaluate({
          category: NotificationCategory.System,
          channel: NotificationChannelType.InApp,
          rateLimit,
          rateLimitUsage: { hourCount: 2, dayCount: 3 },
        }),
      ).toMatchObject({ outcome: 'rate_limited', reason: 'rate_limit_hour' });

      expect(
        policy.evaluate({
          category: NotificationCategory.System,
          channel: NotificationChannelType.InApp,
          rateLimit,
          rateLimitUsage: { hourCount: 0, dayCount: 5 },
        }),
      ).toMatchObject({ outcome: 'rate_limited', reason: 'rate_limit_day' });

      expect(
        policy.evaluate({
          category: NotificationCategory.System,
          channel: NotificationChannelType.InApp,
          rateLimit,
          rateLimitUsage: { hourCount: 0, dayCount: 4 },
        }),
      ).toMatchObject({ outcome: 'deliver_now', reason: 'allowed' });
    });
  });

});
