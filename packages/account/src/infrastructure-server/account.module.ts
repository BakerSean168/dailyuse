import type { Result } from '@dailyuse/contracts/result';
import type { ExecutionContext } from '@dailyuse/contracts/shared';
import type { IAccountRepository } from '../domain-server';
import {
  GetAccountProfileUseCase,
  UpdateAccountProfileUseCase,
  UpdateAccountSettingsUseCase,
  CloseAccountUseCase,
  CheckAvailabilityUseCase,
} from '../application-server';
import type {
  CheckAvailabilityReq,
  CheckAvailabilityRes,
  CloseAccountReq,
  AccountClientDTO,
  AccountSettingsDTO,
  UpdateAccountReq,
  UpdateAccountSettingsReq,
} from '@dailyuse/contracts/account';

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
  readonly getProfile: GetAccountProfileUseCase;
  readonly updateProfile: UpdateAccountProfileUseCase;
  readonly updateSettings: UpdateAccountSettingsUseCase;
  readonly closeAccount: CloseAccountUseCase;
  readonly checkAvailability: CheckAvailabilityUseCase;
}

/** Transport-neutral application surface consumed by HTTP and Electron. */
export interface AccountApplicationPort {
  getProfile(cx: ExecutionContext): Promise<Result<AccountClientDTO | null>>;
  updateProfile(data: UpdateAccountReq, cx: ExecutionContext): Promise<Result<AccountClientDTO>>;
  updateSettings(
    data: UpdateAccountSettingsReq,
    cx: ExecutionContext,
  ): Promise<Result<AccountSettingsDTO>>;
  checkAvailability(data: CheckAvailabilityReq): Promise<Result<CheckAvailabilityRes>>;
  closeAccount(data: CloseAccountReq, cx: ExecutionContext): Promise<Result<void>>;
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
