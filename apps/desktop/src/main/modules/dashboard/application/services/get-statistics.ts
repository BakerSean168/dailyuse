import { GetDashboardStatistics } from '@dailyuse/application-server';
import type { DashboardStatisticsClientDTO } from '@dailyuse/contracts/dashboard';
import { createLogger } from '@dailyuse/utils';

const logger = createLogger('getStatisticsService');

export async function getStatisticsService(accountUuid: string): Promise<DashboardStatisticsClientDTO> {
  logger.debug('Getting dashboard statistics', { accountUuid });
  const statisticsService = GetDashboardStatistics.getInstance();
  const result = await statisticsService.execute(accountUuid);
  return result.statistics;
}
