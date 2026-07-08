import type { NotificationCategory, NotificationChannelType } from '@dailyuse/contracts/notification';
import { BusinessRuleViolationError } from '@dailyuse/utils/errors';
import type { NotificationPreference } from '../aggregates/notification-preference';
import { DoNotDisturbConfig } from '../value-objects/do-not-disturb-config';
import { RateLimit } from '../value-objects/rate-limit';

export interface NotificationPolicyContext {
  category: NotificationCategory;
  channel: NotificationChannelType;
  preference?: NotificationPreference | null;
  doNotDisturb?: DoNotDisturbConfig | null;
  rateLimit?: RateLimit | null;
  rateLimitUsage?: { hourCount: number; dayCount: number };
  now?: Date;
}

export class NotificationPolicy {
  public assertCanSend(context: NotificationPolicyContext): void {
    if (context.preference) {
      const allowed = context.preference.shouldSendNotification(
        context.category,
        context.channel,
      );
      if (!allowed) {
        throw new BusinessRuleViolationError('User preferences block this notification.');
      }
    }

    if (context.doNotDisturb) {
      const now = context.now ?? new Date();
      if (context.doNotDisturb.isActiveAt(now)) {
        throw new BusinessRuleViolationError('Do-not-disturb is active.');
      }
    }

    if (context.rateLimit && context.rateLimitUsage) {
      if (context.rateLimit.wouldExceed(
        context.rateLimitUsage.hourCount,
        context.rateLimitUsage.dayCount,
      )) {
        throw new BusinessRuleViolationError('Notification rate limit exceeded.');
      }
    }
  }
}
