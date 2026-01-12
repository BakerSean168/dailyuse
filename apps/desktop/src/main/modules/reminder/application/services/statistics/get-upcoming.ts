/**
 * Get Upcoming Reminders Service
 */

import { ListReminderTemplates } from '@dailyuse/application-server';
import type { ReminderTemplateClientDTO } from '@dailyuse/contracts/reminder';
import { createLogger } from '@dailyuse/utils';

const logger = createLogger('getUpcomingService');

export async function getUpcomingService(
  days: number = 7,
  accountUuid: string,
): Promise<{
  templates: ReminderTemplateClientDTO[];
  total: number;
}> {
  logger.debug('Getting upcoming reminders', { days, accountUuid });

  const result = await ListReminderTemplates.getInstance().execute(accountUuid, {
    effectiveEnabled: true,
  });

  const now = Date.now();
  const endDate = now + days * 24 * 60 * 60 * 1000;

  const upcomingTemplates = result.templates.filter((t) => {
    const nextTriggerAt = t.nextTriggerAt;
    if (!nextTriggerAt) return false;
    const nextTime = typeof nextTriggerAt === 'number' ? nextTriggerAt : new Date(nextTriggerAt).getTime();
    return nextTime >= now && nextTime <= endDate;
  });

  return {
    templates: upcomingTemplates,
    total: upcomingTemplates.length,
  };
}
