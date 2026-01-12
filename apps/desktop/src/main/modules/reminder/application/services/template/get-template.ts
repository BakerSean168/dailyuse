/**
 * Get Reminder Template Service
 */

import { GetReminderTemplate } from '@dailyuse/application-server';
import type { ReminderTemplateClientDTO } from '@dailyuse/contracts/reminder';
import { createLogger } from '@dailyuse/utils';

const logger = createLogger('getTemplateService');

export async function getTemplateService(uuid: string): Promise<ReminderTemplateClientDTO | null> {
  logger.debug('Getting reminder template', { uuid });
  return GetReminderTemplate.getInstance().execute(uuid);
}
