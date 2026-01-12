import { DashboardContainer, InvalidateDashboardCache } from '@dailyuse/application-server';
import { createLogger } from '@dailyuse/utils';

const logger = createLogger('invalidateCacheService');

export async function invalidateCacheService(accountUuid: string): Promise<void> {
  logger.debug('Invalidating dashboard cache', { accountUuid });
  const container = DashboardContainer.getInstance();
  if (container.hasCacheService()) {
    await InvalidateDashboardCache.getInstance().execute(accountUuid);
  }
}
