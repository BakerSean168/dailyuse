/**
 * Notification Module — Export Projections
 */

import type { PortableNotificationPreference } from '@dailyuse/contracts/data-portability';
import { parseJsonField, toBoolean } from './projection-helpers';

export function projectNotificationPreference(pref: unknown): PortableNotificationPreference {
  const entity = pref as Record<string, unknown>;
  return {
    channels: parseJsonField(entity.channels) ?? {},
    categories: parseJsonField(entity.categories) ?? {},
    doNotDisturb: entity.doNotDisturb ? parseJsonField(entity.doNotDisturb) : undefined,
    rateLimit: entity.rateLimit ? parseJsonField(entity.rateLimit) : undefined,
    enabled: entity.enabled == null ? undefined : toBoolean(entity.enabled, true),
  };
}
