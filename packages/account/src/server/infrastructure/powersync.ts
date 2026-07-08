import { createAccountModule, type AccountModuleInstance } from './account.module';
import {
  PowerSyncAccountRepository,
  type Transactional,
} from './adapters/powersync/account-powersync.repository';
import {
  createAccountRuntimeContributions,
  type AccountRuntimeContributionsInput,
} from './runtime';

export interface CreateAccountPowerSyncModuleOptions {
  readonly runtimeContributions?: AccountRuntimeContributionsInput;
}

export function createAccountPowerSyncModule(
  db: Transactional,
  options: CreateAccountPowerSyncModuleOptions = {},
): AccountModuleInstance {
  const accountRepository = new PowerSyncAccountRepository(db);

  return createAccountModule({
    accountRepository,
    runtimeContributions: createAccountRuntimeContributions(
      accountRepository,
      options.runtimeContributions,
    ),
  });
}
