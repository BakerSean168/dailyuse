/**
 * List Active Reminder Templates Service
 */

import { ListReminderTemplates } from '@dailyuse/reminder/application-server';
import type { ReminderTemplateClientDTO } from '@dailyuse/contracts/reminder';
import { createLogger } from '@dailyuse/utils';

const logger = createLogger('listActiveTemplatesService');

export async function listActiveTemplatesService(
  accountUuid: string,
): Promise<{
  templates: ReminderTemplateClientDTO[];
  total: number;
}> {
  logger.debug('Listing active reminder templates', { accountUuid });
  const result = await ListReminderTemplates.getInstance().execute(accountUuid, { effectiveEnabled: true });
  return {
    templates: result.templates,
    total: result.total,
  };
}
