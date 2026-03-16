import type { IAccountRepository } from '../domain-server';
import {
  GetAccountProfileUseCase,
  UpdateAccountProfileUseCase,
  CloseAccountUseCase,
  CheckAvailabilityUseCase,
} from '../application-server';
import type { UpdateProfileResult, CloseAccountResult } from '../application-server';
import type {
  CheckAvailabilityReq,
  CheckAvailabilityRes,
  CloseAccountReq,
  GetAccountRes,
  UpdateAccountReq,
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
  readonly closeAccount: CloseAccountUseCase;
  readonly checkAvailability: CheckAvailabilityUseCase;
}

/** Transport-neutral application surface consumed by HTTP and Electron. */
export interface AccountApplicationPort {
  getProfile(identityId: string): Promise<GetAccountRes | null>;
  updateProfile(identityId: string, data: UpdateAccountReq): Promise<UpdateProfileResult>;
  checkAvailability(data: CheckAvailabilityReq): Promise<CheckAvailabilityRes>;
  closeAccount(identityId: string, data: CloseAccountReq): Promise<CloseAccountResult>;
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
 * 给定仓储端口，返回已经接好线的 account use case 集合。
 */
export function createAccountUseCases(
  dependencies: AccountModuleDependencies,
): AccountModuleUseCases {
  const { accountRepository } = dependencies;

  return {
    getProfile: new GetAccountProfileUseCase(accountRepository),
    updateProfile: new UpdateAccountProfileUseCase(accountRepository),
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
 * Account 模块新的标准组合根。
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
      getProfile: (identityId) => useCases.getProfile.execute(identityId),
      updateProfile: (identityId, data) => useCases.updateProfile.execute(identityId, data),
      checkAvailability: (data) => useCases.checkAvailability.execute(data),
      closeAccount: (identityId, data) => useCases.closeAccount.execute(identityId, data),
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
