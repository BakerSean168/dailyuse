import type { PowerSyncDatabase } from '@powersync/node';
import {
  PowerSyncAuthIdentityRepository,
  PowerSyncAuthSessionRepository,
  Argon2Hasher,
} from '@memoflow/authentication/electron';
import { PowerSyncAccountRepository } from '@memoflow/account/electron';
import { createLogger } from '@memoflow/utils/logger';
import { AuthDesktopApplicationService } from './auth-desktop-application-service';
import type { TokenManager, RememberedAccountsService, NetworkStateManager } from '../infrastructure';
import type { WindowManager } from '../../../lifecycle/window-manager';

export function createDesktopProfileAuthService(
  db: PowerSyncDatabase,
  tokenManager: TokenManager,
  rememberedAccountsService: RememberedAccountsService,
  networkStateManager: NetworkStateManager,
  windowManager: WindowManager,
): AuthDesktopApplicationService {
  const logger = createLogger('DesktopProfileAuthService');
  const repositoryDb = db as ConstructorParameters<typeof PowerSyncAuthIdentityRepository>[0];
  const identityRepository = new PowerSyncAuthIdentityRepository(repositoryDb);
  const sessionRepository = new PowerSyncAuthSessionRepository(repositoryDb);
  const accountRepository = new PowerSyncAccountRepository(repositoryDb);
  const passwordHasher = new Argon2Hasher();

  const service = new AuthDesktopApplicationService(tokenManager, rememberedAccountsService, networkStateManager, windowManager, logger);
  service.setRepositories(sessionRepository, identityRepository);
  service.setAccountRepository(accountRepository);
  service.setOfflineAuthDependencies(identityRepository, passwordHasher);

  return service;
}
