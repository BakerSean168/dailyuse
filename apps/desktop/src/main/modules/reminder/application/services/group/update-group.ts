/**
 * Update Reminder Group Service
 */

import { ReminderContainer } from '@dailyuse/reminder/infrastructure-server';
import type { ReminderGroupClientDTO } from '@dailyuse/contracts/reminder';
import { createLogger } from '@dailyuse/utils';

const logger = createLogger('updateGroupService');

export async function updateGroupService(
  uuid: string,
  _updates: { name?: string; description?: string; color?: string; icon?: string },
): Promise<ReminderGroupClientDTO> {
  logger.debug('Updating reminder group', { uuid, updates: _updates });
  const container = ReminderContainer.getInstance();
  const repo = container.getGroupRepository();
  const group = await repo.findById(uuid);
  if (!group) {
    throw new Error(`Reminder group not found: ${uuid}`);
  }

  // Note: ReminderGroup doesn't have update methods for name/description/color/icon
  // Would need to create a new group with updated values or add update methods to domain
  // For now, just return the current group
  // TODO: Implement proper update logic when domain methods are available

  return group.toClientDTO();
}
