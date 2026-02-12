/**
 * Enable Reminder Template Service
 */

import { ReminderContainer } from '@dailyuse/reminder/infrastructure-server';
import type { ReminderTemplateClientDTO } from '@dailyuse/contracts/reminder';
import { createLogger } from '@dailyuse/utils';

const logger = createLogger('enableTemplateService');

export async function enableTemplateService(uuid: string): Promise<ReminderTemplateClientDTO> {
  logger.debug('Enabling reminder template', { uuid });
  const container = ReminderContainer.getInstance();
  const repo = container.getTemplateRepository();
  const template = await repo.findById(uuid);
  if (!template) {
    throw new Error(`Reminder template not found: ${uuid}`);
  }
  template.enable();
  await repo.save(template);
  return template.toClientDTO();
}
