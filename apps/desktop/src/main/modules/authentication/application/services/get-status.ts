import { createLogger } from '@dailyuse/utils/logger';

const logger = createLogger('getStatusService');

export interface AuthStatus {
  authenticated: boolean;
  user: null;
}

export async function getStatusService(): Promise<AuthStatus> {
  logger.debug('Get auth status');
  return { authenticated: true, user: null };
}
