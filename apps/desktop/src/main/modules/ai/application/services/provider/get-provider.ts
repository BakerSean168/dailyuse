import { ListProviders } from '@dailyuse/ai/application-server';
import type { AIProviderConfigClientDTO } from '@dailyuse/contracts/ai';
import { createLogger } from '@dailyuse/utils';

const logger = createLogger('getProviderService');

export async function getProviderService(
  accountUuid: string,
  providerId: string,
): Promise<AIProviderConfigClientDTO | null> {
  logger.debug('Getting provider', { accountUuid, providerId });
  const result = await ListProviders.getInstance().execute(accountUuid);
  return result.providers.find((p) => p.uuid === providerId) || null;
}
