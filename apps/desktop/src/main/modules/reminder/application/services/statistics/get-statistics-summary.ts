/**
 * Get Reminder Statistics Summary Service
 */

import { ReminderContainer } from '@dailyuse/reminder/infrastructure-server';
import type { ReminderStatisticsClientDTO } from '@dailyuse/contracts/reminder';
import { createLogger } from '@dailyuse/utils';

const logger = createLogger('getStatisticsSummaryService');

export async function getStatisticsSummaryService(
  accountUuid: string,
): Promise<ReminderStatisticsClientDTO | null> {
  logger.debug('Getting reminder statistics summary', { accountUuid });
  const container = ReminderContainer.getInstance();
  const repo = container.getStatisticsRepository();
  const statistics = await repo.findByAccountUuid(accountUuid);
  return statistics?.toClientDTO() || null;
}
