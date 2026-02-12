import { GetAccountProfile } from '@dailyuse/account/application-server';
import type { AccountClientDTO } from '@dailyuse/contracts/account';
import { createLogger } from '@dailyuse/utils';

const logger = createLogger('getProfileService');

export async function getProfileService(accountUuid: string): Promise<AccountClientDTO | null> {
  logger.debug('Getting account profile', { accountUuid });
  return GetAccountProfile.getInstance().execute(accountUuid);
}
