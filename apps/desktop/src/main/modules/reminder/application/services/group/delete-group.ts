/**
 * Delete Reminder Group Service
 */

import { ReminderContainer } from '@dailyuse/reminder/infrastructure-server';
import { createLogger } from '@dailyuse/utils';

const logger = createLogger('deleteGroupService');

export async function deleteGroupService(uuid: string): Promise<void> {
  logger.debug('Deleting reminder group', { uuid });
  const container = ReminderContainer.getInstance();
  const repo = container.getGroupRepository();
  await repo.delete(uuid);
}
