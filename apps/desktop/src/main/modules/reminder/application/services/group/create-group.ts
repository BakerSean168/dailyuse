/**
 * Create Reminder Group Service
 */

import { ReminderContainer } from '@dailyuse/reminder/infrastructure-server';
import type { ReminderGroupClientDTO } from '@dailyuse/contracts/reminder';
import { createLogger } from '@dailyuse/utils';

const logger = createLogger('createGroupService');

export async function createGroupService(params: {
  accountUuid: string;
  name: string;
  description?: string;
  color?: string;
  icon?: string;
}): Promise<ReminderGroupClientDTO> {
  logger.debug('Creating reminder group', { name: params.name });
  const container = ReminderContainer.getInstance();
  const repo = container.getGroupRepository();

  const { ReminderGroup } = await import('@dailyuse/reminder/domain-server');
  const group = ReminderGroup.create({
    accountUuid: params.accountUuid,
    name: params.name,
    description: params.description || '',
    color: params.color,
    icon: params.icon,
  });

  await repo.save(group);
  return group.toClientDTO();
}
