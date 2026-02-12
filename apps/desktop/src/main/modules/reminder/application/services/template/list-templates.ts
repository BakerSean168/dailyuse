/**
 * List Reminder Templates Service
 */

import { ListReminderTemplates } from '@dailyuse/reminder/application-server';
import type { ReminderTemplateClientDTO, QueryReminderTemplatesRequest } from '@dailyuse/contracts/reminder';
import { createLogger } from '@dailyuse/utils';

const logger = createLogger('listTemplatesService');

export async function listTemplatesService(
  accountUuid: string,
  params?: QueryReminderTemplatesRequest,
): Promise<{
  templates: ReminderTemplateClientDTO[];
  total: number;
}> {
  logger.debug('Listing reminder templates', { accountUuid, params });
  return ListReminderTemplates.getInstance().execute(accountUuid, params);
}
