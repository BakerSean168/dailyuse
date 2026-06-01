import { createLogger } from '@dailyuse/utils/logger';

const logger = createLogger('loginService');

export interface LoginCredentials {
  email: string;
  password: string;
}

export interface LoginOutput {
  success: boolean;
  token?: string;
  error?: string;
}

export async function loginService(credentials: LoginCredentials): Promise<LoginOutput> {
  logger.debug('Login attempted', { email: credentials.email });
  // Desktop offline mode - local auth only
  return { success: false, error: 'Online authentication not available in offline mode' };
}
