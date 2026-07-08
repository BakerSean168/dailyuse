import type { IAccountRepository } from '../domain';
import {
  ListAccountsUseCase,
  GetAccountProfileUseCase,
  UpdateAccountProfileUseCase,
  UpdateAccountSettingsUseCase,
  CloseAccountUseCase,
  CheckAvailabilityUseCase,
} from '../application';
import type { AccountApplicationPort } from '../application';

/** Explicit dependencies required by the account runtime. */
export interface AccountModuleDependencies {
  readonly accountRepository: IAccountRepository;
  readonly runtimeContributions?:
    | AccountModuleRuntimeContribution
    | readonly AccountModuleRuntimeContribution[];
}

/** Module-owned side effects that start and stop with an account module instance. */
export interface AccountModuleRuntimeContribution {
  start(): void;
  stop(): void;
}

/** Lower-level assembled use cases kept for tests and diagnostics. */
export interface AccountModuleUseCases {
  readonly listAccounts: ListAccountsUseCase;
  readonly getProfile: GetAccountProfileUseCase;
  readonly updateProfile: UpdateAccountProfileUseCase;
  readonly updateSettings: UpdateAccountSettingsUseCase;
  readonly closeAccount: CloseAccountUseCase;
  readonly checkAvailability: CheckAvailabilityUseCase;
}

export interface AccountModuleInstance {
  readonly accountRepository: IAccountRepository;
  readonly useCases: AccountModuleUseCases;
  readonly api: AccountApplicationPort;
  start(): void;
  dispose(): void;
}

/**
 * Pure assembly helper.
 */
export function createAccountUseCases(
  dependencies: AccountModuleDependencies,
): AccountModuleUseCases {
  const { accountRepository } = dependencies;

  return {
    listAccounts: new ListAccountsUseCase(accountRepository),
    getProfile: new GetAccountProfileUseCase(accountRepository),
    updateProfile: new UpdateAccountProfileUseCase(accountRepository),
    updateSettings: new UpdateAccountSettingsUseCase(accountRepository),
    closeAccount: new CloseAccountUseCase(accountRepository),
    checkAvailability: new CheckAvailabilityUseCase(accountRepository),
  };
}

function normalizeRuntimeContributions(
  runtimeContributions?:
    | AccountModuleRuntimeContribution
    | readonly AccountModuleRuntimeContribution[],
): readonly AccountModuleRuntimeContribution[] {
  if (!runtimeContributions) {
    return [];
  }

  if (Array.isArray(runtimeContributions)) {
    return Array.from(runtimeContributions);
  }

  return [runtimeContributions as AccountModuleRuntimeContribution];
}

/**
 * Canonical account composition root.
 */
export function createAccountModule(
  dependencies: AccountModuleDependencies,
): AccountModuleInstance {
  const { accountRepository } = dependencies;
  const runtimeContributions = normalizeRuntimeContributions(dependencies.runtimeContributions);
  const useCases = createAccountUseCases({ accountRepository });
  let started = false;

  return {
    accountRepository,
    useCases,
    api: {
      listAccounts: (options) => useCases.listAccounts.execute(options),
      getProfile: (cx) => useCases.getProfile.execute(cx),
      updateProfile: (data, cx) => useCases.updateProfile.execute(data, cx),
      updateSettings: (data, cx) => useCases.updateSettings.execute(data, cx),
      checkAvailability: (data) => useCases.checkAvailability.execute(data),
      closeAccount: (data, cx) => useCases.closeAccount.execute(data, cx),
    },
    start(): void {
      if (started) return;
      for (const runtime of runtimeContributions) {
        runtime.start();
      }
      started = true;
    },
    dispose(): void {
      if (!started) return;
      for (const runtime of [...runtimeContributions].reverse()) {
        runtime.stop();
      }
      started = false;
    },
  };
}
