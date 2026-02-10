import { GetQuota } from '@dailyuse/ai/application-server';
import type { QuotaResponse } from '@dailyuse/contracts/ai';
import { createLogger } from '@dailyuse/utils';

const logger = createLogger('getQuotaService');

export async function getQuotaService(accountUuid: string): Promise<QuotaResponse> {
  logger.debug('Getting quota', { accountUuid });
  return GetQuota.getInstance().execute(accountUuid);
}
