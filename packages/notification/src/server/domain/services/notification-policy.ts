import type { NotificationCategory, NotificationChannelType } from '@memoflow/contracts/notification';
import { BusinessRuleViolationError } from '@memoflow/utils/errors';
import type { NotificationPreference } from '../aggregates/notification-preference';
import { DoNotDisturbConfig } from '../value-objects/do-not-disturb-config';
import { RateLimit } from '../value-objects/rate-limit';

export type NotificationDeliveryOutcome =
  | 'deliver_now'
  | 'suppressed'
  | 'deferred'
  | 'rate_limited';

export type NotificationDeliveryReason =
  | 'allowed'
  | 'user_preference_disabled'
  | 'dnd_active'
  | 'rate_limit_hour'
  | 'rate_limit_day';

export interface NotificationDeliveryDecision {
  channel: NotificationChannelType;
  outcome: NotificationDeliveryOutcome;
  reason: NotificationDeliveryReason;
  retryAt?: Date;
}

export interface NotificationPolicyContext {
  category: NotificationCategory;
  channel: NotificationChannelType;
  preference?: NotificationPreference | null;
  doNotDisturb?: DoNotDisturbConfig | null;
  rateLimit?: RateLimit | null;
  rateLimitUsage?: { hourCount: number; dayCount: number };
  now?: Date;
  /**
   * Critical/workflow bypass is opt-in only. Nothing in NotificationType or
   * category implicitly bypasses account-level DND.
   */
  bypassDoNotDisturb?: boolean;
}

export class NotificationPolicy {
  public evaluate(context: NotificationPolicyContext): NotificationDeliveryDecision {
    if (context.preference) {
      const allowed = context.preference.shouldSendNotification(
        context.category,
        context.channel,
      );
      if (!allowed) {
        return {
          channel: context.channel,
          outcome: 'suppressed',
          reason: 'user_preference_disabled',
        };
      }
    }

    if (context.rateLimit?.enabled && context.rateLimitUsage) {
      if (context.rateLimitUsage.hourCount >= context.rateLimit.maxPerHour) {
        return {
          channel: context.channel,
          outcome: 'rate_limited',
          reason: 'rate_limit_hour',
        };
      }
      if (context.rateLimitUsage.dayCount >= context.rateLimit.maxPerDay) {
        return {
          channel: context.channel,
          outcome: 'rate_limited',
          reason: 'rate_limit_day',
        };
      }
    }

    if (context.doNotDisturb && !context.bypassDoNotDisturb) {
      const now = context.now ?? new Date();
      if (context.doNotDisturb.isActiveAt(now)) {
        const retryAt = context.doNotDisturb.nextInactiveAt(now);
        return {
          channel: context.channel,
          outcome: 'deferred',
          reason: 'dnd_active',
          ...(retryAt ? { retryAt } : {}),
        };
      }
    }

    return {
      channel: context.channel,
      outcome: 'deliver_now',
      reason: 'allowed',
    };
  }

  /**
   * Compatibility guard for callers/tests that still need exception semantics.
   * The production create path uses evaluate() so one blocked channel cannot
   * abort the Notification Fact or accidentally authorize sibling channels.
   */
  public assertCanSend(context: NotificationPolicyContext): void {
    const decision = this.evaluate(context);
    if (decision.outcome === 'deliver_now') {
      return;
    }

    const message =
      decision.outcome === 'suppressed'
        ? 'User preferences block this notification.'
        : decision.outcome === 'deferred'
          ? 'Do-not-disturb is active.'
          : 'Notification rate limit exceeded.';
    throw new BusinessRuleViolationError(message);
  }
}
