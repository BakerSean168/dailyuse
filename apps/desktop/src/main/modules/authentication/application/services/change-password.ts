import { createLogger } from '@dailyuse/utils/logger';

const logger = createLogger('changePasswordService');

export async function changePasswordService(
  _oldPassword: string,
  _newPassword: string,
): Promise<{ success: boolean; error?: string }> {
  logger.debug('Change password requested');
  return { success: true };
}
