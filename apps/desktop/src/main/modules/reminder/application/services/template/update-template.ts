/**
 * Update Reminder Template Service
 */

import { ReminderContainer } from '@dailyuse/reminder/infrastructure-server';
import type { ReminderTemplateClientDTO } from '@dailyuse/contracts/reminder';
import { createLogger } from '@dailyuse/utils';

const logger = createLogger('updateTemplateService');

export async function updateTemplateService(
  uuid: string,
  _accountUuid: string,
  updates: { title?: string; description?: string },
): Promise<ReminderTemplateClientDTO> {
  logger.debug('Updating reminder template', { uuid, updates });
  const container = ReminderContainer.getInstance();
  const repo = container.getTemplateRepository();
  const template = await repo.findById(uuid);
  if (!template) {
    throw new Error(`Reminder template not found: ${uuid}`);
  }

  template.update({
    title: updates.title,
    description: updates.description,
  });

  await repo.save(template);
  return template.toClientDTO();
}
