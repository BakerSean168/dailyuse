/**
 * Get Reminder Group Service
 */

import { ReminderContainer } from '@dailyuse/reminder/infrastructure-server';
import type { ReminderGroupClientDTO } from '@dailyuse/contracts/reminder';
import { createLogger } from '@dailyuse/utils';

const logger = createLogger('getGroupService');

export async function getGroupService(uuid: string): Promise<ReminderGroupClientDTO | null> {
  logger.debug('Getting reminder group', { uuid });
  const container = ReminderContainer.getInstance();
  const repo = container.getGroupRepository();
  const group = await repo.findById(uuid);
  return group?.toClientDTO() || null;
}
