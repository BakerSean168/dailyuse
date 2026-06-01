import { createLogger } from '@dailyuse/utils/logger';

const logger = createLogger('logoutService');

export async function logoutService(): Promise<{ success: boolean }> {
  logger.debug('Logout');
  return { success: true };
}
