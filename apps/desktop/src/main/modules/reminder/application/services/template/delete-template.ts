/**
 * Delete Reminder Template Service
 */

import { DeleteReminderTemplate } from '@dailyuse/reminder/application-server';
import { createLogger } from '@dailyuse/utils';

const logger = createLogger('deleteTemplateService');

export async function deleteTemplateService(uuid: string, accountUuid: string): Promise<void> {
  logger.debug('Deleting reminder template', { uuid });
  await DeleteReminderTemplate.getInstance().execute(uuid, accountUuid);
}
