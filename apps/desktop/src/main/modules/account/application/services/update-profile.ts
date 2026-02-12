import { UpdateAccountProfile } from '@dailyuse/account/application-server';
import type { AccountClientDTO, UpdateAccountProfileRequest } from '@dailyuse/contracts/account';
import { createLogger } from '@dailyuse/utils';

const logger = createLogger('updateProfileService');

export async function updateProfileService(
  accountUuid: string,
  input: UpdateAccountProfileRequest,
): Promise<AccountClientDTO> {
  logger.debug('Updating account profile', { accountUuid });
  return UpdateAccountProfile.getInstance().execute(accountUuid, input);
}
