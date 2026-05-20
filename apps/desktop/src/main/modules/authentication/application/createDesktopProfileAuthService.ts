import type { PowerSyncDatabase } from '@powersync/node';
import {
  PowerSyncAuthIdentityRepository,
  PowerSyncAuthSessionRepository,
  Argon2Hasher,
} from '@dailyuse/authentication/infrastructure-server';
import { PowerSyncAccountRepository } from '@dailyuse/account/infrastructure-server';
import { createLogger } from '@dailyuse/utils';
import { AuthDesktopApplicationService } from './AuthDesktopApplicationService';

export function createDesktopProfileAuthService(db: PowerSyncDatabase): AuthDesktopApplicationService {
  const logger = createLogger('DesktopProfileAuthService');
  const identityRepository = new PowerSyncAuthIdentityRepository(db as any);
  const sessionRepository = new PowerSyncAuthSessionRepository(db as any);
  const accountRepository = new PowerSyncAccountRepository(db as any);
  const passwordHasher = new Argon2Hasher();

  const service = new AuthDesktopApplicationService(logger);
  service.setRepositories(sessionRepository, identityRepository);
  service.setAccountRepository(accountRepository);
  service.setOfflineAuthDependencies(identityRepository, passwordHasher);

  return service;
}
