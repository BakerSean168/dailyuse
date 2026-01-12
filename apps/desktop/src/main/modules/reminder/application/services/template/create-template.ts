/**
 * Create Reminder Template Service
 */

import { CreateReminderTemplate } from '@dailyuse/application-server';
import type { ReminderTemplateClientDTO, CreateReminderTemplateRequest } from '@dailyuse/contracts/reminder';
import { createLogger } from '@dailyuse/utils';

const logger = createLogger('createTemplateService');

export async function createTemplateService(
  accountUuid: string,
  input: CreateReminderTemplateRequest,
): Promise<ReminderTemplateClientDTO> {
  logger.debug('Creating reminder template', { title: input.title });
  return CreateReminderTemplate.getInstance().execute(accountUuid, input);
}
