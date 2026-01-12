import { ListProviders } from '@dailyuse/application-server';
import type { AIProviderConfigClientDTO } from '@dailyuse/contracts/ai';
import { createLogger } from '@dailyuse/utils';

const logger = createLogger('listProvidersService');

export async function listProvidersService(
  accountUuid: string,
): Promise<{ providers: AIProviderConfigClientDTO[] }> {
  logger.debug('Listing providers', { accountUuid });
  return ListProviders.getInstance().execute(accountUuid);
}
