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
  const repositoryDb = db as ConstructorParameters<typeof PowerSyncAuthIdentityRepository>[0];
  const identityRepository = new PowerSyncAuthIdentityRepository(repositoryDb);
  const sessionRepository = new PowerSyncAuthSessionRepository(repositoryDb);
  const accountRepository = new PowerSyncAccountRepository(repositoryDb);
  const passwordHasher = new Argon2Hasher();

  const service = new AuthDesktopApplicationService(logger);
  service.setRepositories(sessionRepository, identityRepository);
  service.setAccountRepository(accountRepository);
  service.setOfflineAuthDependencies(identityRepository, passwordHasher);

  return service;
}
