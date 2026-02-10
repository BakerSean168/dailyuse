/**
 * List Reminder Groups Service
 */

import { ReminderContainer } from '@dailyuse/reminder/infrastructure-server';
import type { ReminderGroupClientDTO } from '@dailyuse/contracts/reminder';
import type { ReminderGroup } from '@dailyuse/reminder/domain-server';
import { createLogger } from '@dailyuse/utils';

const logger = createLogger('listGroupsService');

export async function listGroupsService(
  accountUuid: string,
): Promise<{
  groups: ReminderGroupClientDTO[];
  total: number;
}> {
  logger.debug('Listing reminder groups', { accountUuid });
  const container = ReminderContainer.getInstance();
  const repo = container.getGroupRepository();
  const groups = await repo.findByAccountUuid(accountUuid);
  return {
    groups: groups.map((g: ReminderGroup) => g.toClientDTO()),
    total: groups.length,
  };
}
